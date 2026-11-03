import bcrypt from "bcrypt";
import prisma from "./prisma";

/** Explicit demo-data seed for development only; never runs on server startup. */
export async function seedDemoData() {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Demo seeding is disabled. Set ALLOW_DEMO_SEED=true in a non-production environment.");
  }

  const password = await bcrypt.hash("password123", 12);

  await prisma.$transaction(async (tx) => {
    const admin = await tx.user.upsert({
      where: { email: "admin@portal.com" },
      update: {},
      create: { email: "admin@portal.com", password, role: "ADMIN" },
    });

    const techUser = await tx.user.upsert({
      where: { email: "hr@techcorp.com" },
      update: {},
      create: { email: "hr@techcorp.com", password, role: "COMPANY" },
    });
    const tech = await tx.company.upsert({
      where: { userId: techUser.id },
      update: {},
      create: { userId: techUser.id, name: "TechCorp Solutions", description: "Cloud intelligence and web applications firm.", website: "https://techcorp-demo.com" },
    });

    const designUser = await tx.user.upsert({
      where: { email: "careers@innovatestudio.io" },
      update: {},
      create: { email: "careers@innovatestudio.io", password, role: "COMPANY" },
    });
    const design = await tx.company.upsert({
      where: { userId: designUser.id },
      update: {},
      create: { userId: designUser.id, name: "Innovate Design Studio", description: "A design agency building digital products.", website: "https://innovatestudio.io" },
    });

    const studentUser = await tx.user.upsert({
      where: { email: "alex@student.edu" },
      update: {},
      create: { email: "alex@student.edu", password, role: "STUDENT" },
    });
    const student = await tx.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: { userId: studentUser.id, name: "Alex Johnson", bio: "Computer Science student interested in React and TypeScript.", skills: ["React", "TypeScript", "Problem Solving"] },
    });

    const jobs = [
      { companyId: tech.id, title: "Frontend Engineering Intern", description: "Build React and Next.js dashboards with an experienced web team.", location: "Remote / Hybrid", type: "INTERNSHIP" },
      { companyId: tech.id, title: "Junior Backend Developer", description: "Work with Node.js, Express, REST APIs, and modern databases.", location: "New York, NY", type: "FULL_TIME" },
      { companyId: design.id, title: "UI/UX Design Intern", description: "Contribute to user research and modern web product design.", location: "Remote", type: "INTERNSHIP" },
    ];

    for (const job of jobs) {
      const exists = await tx.job.findFirst({ where: { companyId: job.companyId, title: job.title } });
      if (!exists) await tx.job.create({ data: job });
    }

    const firstJob = await tx.job.findFirst({ where: { companyId: tech.id, title: "Frontend Engineering Intern" } });
    if (firstJob) {
      await tx.application.upsert({
        where: { studentId_jobId: { studentId: student.id, jobId: firstJob.id } },
        update: {},
        create: { studentId: student.id, jobId: firstJob.id },
      });
    }

    // Use the admin reference to make the idempotent seed intent explicit.
    void admin;
  });
}
