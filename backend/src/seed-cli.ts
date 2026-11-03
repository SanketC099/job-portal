import "dotenv/config";
import { seedDemoData } from "./seed";

if (process.env.NODE_ENV === "production") {
  throw new Error("Demo seeding is disabled in production.");
}
if (!/^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL || "")) {
  throw new Error("Demo seeding requires DATABASE_URL to point to a PostgreSQL database.");
}

process.env.ALLOW_DEMO_SEED = "true";
seedDemoData()
  .then(() => console.log("Demo data seed complete."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { default: prisma } = await import("./prisma");
    await prisma.$disconnect();
  });
