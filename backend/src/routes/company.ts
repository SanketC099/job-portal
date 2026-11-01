// src/routes/company.ts
import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

// Get own company profile (protected, role COMPANY)
router.get("/me", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const company = await prisma.company.findUnique({
    where: { userId },
    include: { jobs: true },
  });
  if (!company) return res.status(404).json({ error: "Company not found" });
  res.json(company);
});

// Update company profile
router.put("/me", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { name, description, website } = req.body;
  const updated = await prisma.company.update({
    where: { userId },
    data: { name, description, website },
  });
  res.json(updated);
});

// Create a job posting (protected)
router.post("/jobs", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { title, description, location, type } = req.body;
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return res.status(403).json({ error: "Not a company" });
  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      title,
      description,
      location,
      type,
    },
  });
  res.status(201).json(job);
});

// Update own job
router.put("/jobs/:id", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const jobId = Number(req.params.id);
  const { title, description, location, type } = req.body;
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return res.status(403).json({ error: "Not a company" });
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.companyId !== company.id) return res.status(404).json({ error: "Job not found" });
  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { title, description, location, type },
  });
  res.json(updated);
});

// Delete own job
router.delete("/jobs/:id", authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const jobId = Number(req.params.id);
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return res.status(403).json({ error: "Not a company" });
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.companyId !== company.id) return res.status(404).json({ error: "Job not found" });
  await prisma.job.delete({ where: { id: jobId } });
  res.json({ success: true });
});

export default router;
