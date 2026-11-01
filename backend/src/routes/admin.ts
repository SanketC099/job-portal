// src/routes/admin.ts
import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// Middleware: require ADMIN role
const requireAdmin = (req: Request, res: Response, next: any) => {
  if ((req as any).auth?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Platform statistics
router.get("/stats", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  const [totalStudents, totalCompanies, totalJobs, totalApplications] = await Promise.all([
    prisma.student.count(),
    prisma.company.count(),
    prisma.job.count(),
    prisma.application.count(),
  ]);
  res.json({ totalStudents, totalCompanies, totalJobs, totalApplications });
});

// List all users
router.get("/users", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

// Delete a user
router.delete("/users/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

// List all jobs (admin view)
router.get("/jobs", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    include: { company: { select: { id: true, name: true } } },
    orderBy: { postedAt: "desc" },
  });
  res.json(jobs);
});

// Delete a job
router.delete("/jobs/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.job.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
