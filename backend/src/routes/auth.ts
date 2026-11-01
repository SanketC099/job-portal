// src/routes/auth.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma";
import { generateToken } from "../middleware/auth";

const router = Router();

// Register (any role). In production you'd separate student/company registration flows.
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, role, name } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: "email, password and role required" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, role },
  });

  // Create role‑specific record
  if (role === "STUDENT") {
    await prisma.student.create({ data: { userId: user.id, name: name ?? "" } });
  } else if (role === "COMPANY") {
    await prisma.company.create({ data: { userId: user.id, name: name ?? "" } });
  }

  const token = generateToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, userId: user.id, role: user.role, email: user.email });
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = generateToken({ userId: user.id, role: user.role });
  res.json({ token, userId: user.id, role: user.role, email: user.email });
});

export default router;
