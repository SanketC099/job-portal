import { Router, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import prisma from "../prisma";
import { authenticate } from "../middleware/auth";
import { resumeStorageConfigured, saveResume, streamResume } from "../storage/resumes";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed = new Set([".pdf", ".doc", ".docx", ".txt"]);
    if (!allowed.has(extension)) return callback(new Error("Only PDF, DOC, DOCX, and TXT resumes are allowed."));
    callback(null, true);
  },
});

function normalizeSkills(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  const skills = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return skills
    .filter((skill): skill is string => typeof skill === "string")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 30);
}

router.get("/me", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, email: true, role: true } },
      applications: { include: { job: { include: { company: true } } } },
    },
  });
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json({
    ...student,
    user: student.user ? { id: student.user.id, email: student.user.email, role: student.user.role } : undefined,
  });
});

router.put("/me", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
  const bio = typeof req.body.bio === "string" ? req.body.bio.trim() : undefined;
  if (name !== undefined && name.length > 120) return res.status(400).json({ error: "Name is too long" });
  if (bio !== undefined && bio.length > 2000) return res.status(400).json({ error: "Bio is too long" });
  const skills = normalizeSkills(req.body.skills);
  const updated = await prisma.student.update({
    where: { userId },
    data: { ...(name !== undefined ? { name } : {}), ...(bio !== undefined ? { bio } : {}), ...(skills ? { skills } : {}) },
  });
  res.json(updated);
});

router.post("/resume", authenticate, upload.single("resume"), async (req: Request, res: Response) => {
  const auth = (req as any).auth;
  if (auth?.role !== "STUDENT") return res.status(403).json({ error: "Only students can upload resumes." });
  if (!req.file) return res.status(400).json({ error: "No resume file provided." });
  if (process.env.NODE_ENV === "production" && !resumeStorageConfigured) {
    return res.status(503).json({ error: "Resume storage is not configured." });
  }

  const student = await prisma.student.findUnique({ where: { userId: auth.userId } });
  if (!student) return res.status(404).json({ error: "Student profile not found." });
  const stored = await saveResume(student.id, req.file);
  const updated = await prisma.student.update({ where: { id: student.id }, data: stored });
  res.json({ success: true, message: "Resume uploaded successfully.", resumePath: updated.resumePath, student: updated });
});

router.get("/:id/resume", authenticate, async (req: Request, res: Response) => {
  const studentId = Number(req.params.id);
  if (!Number.isSafeInteger(studentId) || studentId < 1) return res.status(400).json({ error: "Invalid student ID." });
  const auth = (req as any).auth;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!student) return res.status(404).json({ error: "Student not found." });

  let allowed = auth?.role === "ADMIN" || (auth?.role === "STUDENT" && auth.userId === student.userId);
  if (!allowed && auth?.role === "COMPANY") {
    const company = await prisma.company.findUnique({ where: { userId: auth.userId } });
    if (company) {
      const application = await prisma.application.findFirst({
        where: { studentId, job: { companyId: company.id } },
        select: { id: true },
      });
      allowed = Boolean(application);
    }
  }
  if (!allowed) return res.status(403).json({ error: "You are not allowed to view this resume." });

  const fileName = `${student.name.replace(/[^a-zA-Z0-9_-]+/g, "_")}_Resume`;
  if (student.resumeKey) {
    await streamResume(student.resumeKey, `${fileName}${path.extname(student.resumeKey) || ".pdf"}`, res);
    return;
  }

  if (student.resumePath) {
    const localPath = path.join(process.cwd(), "uploads", "resumes", path.basename(student.resumePath));
    if (fs.existsSync(localPath)) return res.download(localPath, `${fileName}${path.extname(localPath)}`);
  }

  const skills = student.skills.length ? student.skills.join(", ") : "Full-Stack Development, Problem Solving, Communication";
  const generatedResumeText = [
    "================================================================================",
    student.name.toUpperCase(),
    "================================================================================",
    `Email: ${student.user?.email || ""}`,
    "",
    "PROFESSIONAL SUMMARY",
    student.bio || "Motivated student eager to apply technical and interpersonal skills.",
    "",
    "TECHNICAL SKILLS & COMPETENCIES",
    skills,
    "",
    `Generated on: ${new Date().toISOString().slice(0, 10)}`,
  ].join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}.txt"`);
  return res.send(generatedResumeText);
});

export default router;
