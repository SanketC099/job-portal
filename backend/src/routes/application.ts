// src/routes/application.ts
import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

function serializeApplicantApplication(application: any) {
  if (!application?.student) return application;
  const { user, ...student } = application.student;
  return {
    ...application,
    student: {
      ...student,
      email: user?.email,
      resumeUrl: `/api/students/${student.id}/resume`,
    },
  };
}

// Student applies to a job (protected, role STUDENT)
router.post('/jobs/:jobId/apply', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const userRole = (req as any).auth?.role;
  const jobId = Number(req.params.jobId);

  if (userRole !== 'STUDENT') {
    return res.status(403).json({ error: 'Only student accounts can apply for jobs.' });
  }

  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return res.status(403).json({ error: 'Student profile not found.' });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  try {
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        jobId,
      },
    });
    res.status(201).json(application);
  } catch (e: any) {
    // Unique constraint violation means duplicate application
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'You have already applied to this job.' });
    }
    throw e;
  }
});

// Student views own applications with live status
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) return res.status(403).json({ error: 'Student profile not found.' });

  const apps = await prisma.application.findMany({
    where: { studentId: student.id },
    include: {
      job: {
        include: {
          company: { select: { id: true, name: true } }
        }
      }
    },
  });
  res.json(apps);
});

// Company views all applicants across all their job postings (with search/filter)
router.get('/company', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) {
    return res.status(403).json({ error: 'Access denied. Company profile not found.' });
  }

  // Find all jobs belonging to this company
  const companyJobs = await prisma.job.findMany({ where: { companyId: company.id } });
  const companyJobIds = companyJobs.map(j => j.id);

  const jobIdQuery = req.query.jobId ? Number(req.query.jobId) : null;
  const targetJobIds = jobIdQuery ? companyJobIds.filter(id => id === jobIdQuery) : companyJobIds;

  if (targetJobIds.length === 0) {
    return res.json([]);
  }

  const apps = await prisma.application.findMany({
    where: { jobId: { in: targetJobIds } },
    include: {
      student: { include: { user: { select: { email: true } } } },
      job: true,
    },
  });

  res.json(apps.map(serializeApplicantApplication));
});

// Company views applications for a specific job posting
router.get('/jobs/:jobId', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const jobId = Number(req.params.jobId);

  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return res.status(403).json({ error: 'Access denied. Company profile not found.' });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.companyId !== company.id) {
    return res.status(404).json({ error: 'Job not found or not owned by your company.' });
  }

  const apps = await prisma.application.findMany({
    where: { jobId },
    include: {
      student: { include: { user: { select: { email: true } } } },
      job: true,
    },
  });
  res.json(apps.map(serializeApplicantApplication));
});

// Core status update function with role verification, ownership checks, and duplicate prevention
async function handleStatusUpdate(req: Request, res: Response, appId: number, targetJobId?: number) {
  const userId = (req as any).auth?.userId;
  const userRole = (req as any).auth?.role;
  const { status } = req.body;

  if (userRole !== 'COMPANY') {
    return res.status(403).json({ error: 'Unauthorized: Only company accounts can update applicant status.' });
  }

  const allowedStatuses = ['APPLIED', 'ACCEPTED', 'REJECTED'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status '${status}'. Must be one of: ${allowedStatuses.join(', ')}`
    });
  }

  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) {
    return res.status(403).json({ error: 'Company profile not found for this account.' });
  }

  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { job: true, student: { include: { user: { select: { email: true } } } } }
  });

  if (!application) {
    return res.status(404).json({ error: 'Application record not found.' });
  }

  // If a jobId was in the URL, verify it matches
  if (targetJobId && application.jobId !== targetJobId) {
    return res.status(400).json({ error: 'Application does not belong to the specified job.' });
  }

  // Ownership verification: Only the company that posted the job can update the status
  if (application.job.companyId !== company.id) {
    return res.status(403).json({
      error: 'Forbidden: You do not own this job listing and cannot update its applicants.'
    });
  }

  // Duplicate Acceptance Prevention
  if (status === 'ACCEPTED' && application.status === 'ACCEPTED') {
    return res.status(409).json({
      error: 'Duplicate acceptance prevented: This applicant has already been accepted.'
    });
  }

  // Idempotency check if setting to same status
  if (status === application.status) {
    return res.status(400).json({
      error: `Applicant is already in '${status}' status.`
    });
  }

  // Update status in the database
  const updated = await prisma.application.update({
    where: { id: appId },
    data: { status },
  });

  const refreshedApp = await prisma.application.findUnique({
    where: { id: appId },
    include: { job: true, student: { include: { user: { select: { email: true } } } } }
  });

  return res.json({
    success: true,
    message: `Application successfully marked as ${status}.`,
    application: serializeApplicantApplication(refreshedApp || updated),
  });
}

// Company updates application status (by application ID directly)
router.patch('/:appId/status', authenticate, async (req: Request, res: Response) => {
  const appId = Number(req.params.appId);
  return handleStatusUpdate(req, res, appId);
});

// Company updates application status (by jobId and appId)
router.patch('/jobs/:jobId/:appId/status', authenticate, async (req: Request, res: Response) => {
  const jobId = Number(req.params.jobId);
  const appId = Number(req.params.appId);
  return handleStatusUpdate(req, res, appId, jobId);
});

export default router;
