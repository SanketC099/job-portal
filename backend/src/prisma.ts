import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL || "";
const useJsonStore = process.env.NODE_ENV !== "production" && !/^postgres(?:ql)?:\/\//i.test(databaseUrl);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = useJsonStore
  ? require("./legacy-json").default
  : globalForPrisma.prisma ?? new PrismaClient();

if (!useJsonStore && process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma as PrismaClient;
