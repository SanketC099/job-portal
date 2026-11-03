import "dotenv/config";
import "express-async-errors";
import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";
import studentRoutes from "./routes/student";
import companyRoutes from "./routes/company";
import jobRoutes from "./routes/job";
import applicationRoutes from "./routes/application";
import adminRoutes from "./routes/admin";
import prisma from "./prisma";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  const required = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_ORIGIN", "S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing production configuration: ${missing.join(", ")}`);
  if ((process.env.JWT_SECRET || "").length < 32) throw new Error("JWT_SECRET must be at least 32 characters.");
}
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." },
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  if (res.headersSent) return;
  const status = Number(error?.statusCode || error?.status) || 500;
  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: isProduction && status >= 500 ? "Internal server error" : (error?.message || "Request failed"),
  });
};
app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => console.log(`Backend listening on port ${port}`));
}

export default app;
