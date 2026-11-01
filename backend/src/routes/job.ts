// src/routes/job.ts
import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { optionalAuth } from "../middleware/auth";

const router = Router();

// Public listing with search & filters, pagination
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  const { q, type, location, page = "1", limit = "10" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q as string, mode: "insensitive" } },
      { description: { contains: q as string, mode: "insensitive" } },
    ];
  }
  if (type) where.type = type;
  if (location) where.location = { contains: location as string, mode: "insensitive" };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { company: { select: { id: true, name: true } } },
      skip,
      take: Number(limit),
      orderBy: { postedAt: "desc" },
    }),
    prisma.job.count({ where }),
  ]);

  res.json({ jobs, total, page: Number(page), limit: Number(limit) });
});

// Get single job detail
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  const jobId = Number(req.params.id);
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: { select: { id: true, name: true, description: true, website: true } } },
  });
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

export default router;
