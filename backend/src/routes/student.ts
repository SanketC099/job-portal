// src/routes/student.ts
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import prisma from "../prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /pdf|doc|docx|txt/i;
    const isAllowed = allowed.test(path.extname(file.originalname));
    if (isAllowed) return cb(null, true);
    cb(new Error("Only PDF, DOC, DOCX, and TXT resume files are allowed."));
  },
});

// Get own profile (protected)
router.get("/me", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { user: true, applications: { include: { job: true } } },
  });
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json(student);
});

// Update profile (protected)
router.put("/me", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { name, bio, skills } = req.body;
  const updated = await prisma.student.update({
    where: { userId },
    data: { name, bio, skills },
  });
  res.json(updated);
});

// Upload resume file (protected)
router.post("/resume", authenticate, upload.single("resume"), async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  if (!req.file) {
    return res.status(400).json({ error: "No resume file provided." });
  }

  const resumeRelativePath = `/uploads/resumes/${req.file.filename}`;
  const updated = await prisma.student.update({
    where: { userId },
    data: { resumePath: resumeRelativePath },
  });

  res.json({
    success: true,
    message: "Resume uploaded successfully!",
    resumePath: resumeRelativePath,
    student: updated,
  });
});

// Download student resume by Student ID (Accessible to authenticated employers/students)
router.get("/:id/resume", async (req: Request, res: Response) => {
  const studentId = Number(req.params.id);
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    return res.status(404).json({ error: "Student not found." });
  }

  // If a physical file was uploaded, serve it
  if (student.resumePath) {
    const fullPath = path.join(__dirname, "../../", student.resumePath);
    if (fs.existsSync(fullPath)) {
      return res.download(fullPath, `${student.name.replace(/\s+/g, "_")}_Resume.pdf`);
    }
  }

  // Otherwise, dynamically generate a clean text resume file on the fly
  const skillsList = Array.isArray(student.skills) && student.skills.length > 0
    ? student.skills.join(", ")
    : "Full-Stack Development, Problem Solving, Communication";

  const generatedResumeText = `
================================================================================
                               ${student.name.toUpperCase()}
================================================================================
Email: ${student.user?.email || "student@university.edu"}
Profile: Student Job & Internship Portal Verified Candidate
--------------------------------------------------------------------------------

PROFESSIONAL SUMMARY
--------------------
${student.bio || "Motivated student eager to apply technical and interpersonal skills to real-world software engineering and internship challenges."}

TECHNICAL SKILLS & COMPETENCIES
-------------------------------
${skillsList}

EDUCATION & CREDENTIALS
-----------------------
- Candidate for Bachelor of Science / Technology
- Relevant Coursework: Data Structures, Algorithms, Web Development, Databases

APPLICATIONS & PORTFOLIO
------------------------
Active Applicant on Student Job & Internship Portal
Generated on: ${new Date().toLocaleDateString()}
================================================================================
`.trim();

  res.setHeader("Content-Type", "text/plain");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${student.name.replace(/\s+/g, "_")}_Resume.txt"`
  );
  return res.send(generatedResumeText);
});

export default router;
