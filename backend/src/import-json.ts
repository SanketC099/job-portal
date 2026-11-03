import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "./prisma";

type LegacyDatabase = {
  users: Array<{ id: number; email: string; password: string; role: string; createdAt: string; updatedAt: string }>;
  students: Array<{ id: number; userId: number; name: string; bio?: string | null; skills?: string[]; resumePath?: string | null }>;
  companies: Array<{ id: number; userId: number; name: string; description?: string | null; website?: string | null }>;
  jobs: Array<{ id: number; companyId: number; title: string; description: string; location?: string | null; type: string; postedAt: string }>;
  applications: Array<{ id: number; studentId: number; jobId: number; status: string; appliedAt: string }>;
};

async function importLegacyDatabase() {
  const file = path.resolve(__dirname, "../data/database.json");
  const source = JSON.parse(await fs.readFile(file, "utf8")) as LegacyDatabase;
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.company.count(),
    prisma.job.count(),
    prisma.application.count(),
  ]);
  if (counts.some((count) => count > 0)) {
    throw new Error("Import stopped: target PostgreSQL database is not empty. No data was changed.");
  }

  await prisma.$transaction(async (tx) => {
    if (source.users.length) await tx.user.createMany({ data: source.users.map((user) => ({ ...user, createdAt: new Date(user.createdAt), updatedAt: new Date(user.updatedAt) })) });
    if (source.students.length) await tx.student.createMany({ data: source.students.map((student) => ({ ...student, skills: student.skills ?? [] })) });
    if (source.companies.length) await tx.company.createMany({ data: source.companies });
    if (source.jobs.length) await tx.job.createMany({ data: source.jobs.map((job) => ({ ...job, postedAt: new Date(job.postedAt) })) });
    if (source.applications.length) await tx.application.createMany({ data: source.applications.map((application) => ({ ...application, appliedAt: new Date(application.appliedAt) })) });

    for (const table of ["User", "Student", "Company", "Job", "Application"]) {
      await tx.$queryRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX("id") FROM "${table}"), 1), EXISTS (SELECT 1 FROM "${table}"))`,
      );
    }
  });

  console.log(`Imported ${source.users.length} users, ${source.students.length} students, ${source.companies.length} companies, ${source.jobs.length} jobs, and ${source.applications.length} applications.`);
  console.log("The source JSON file was left unchanged.");
}

importLegacyDatabase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
