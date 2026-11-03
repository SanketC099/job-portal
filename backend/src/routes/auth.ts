// src/routes/auth.ts
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma";
import { generateToken } from "../middleware/auth";

const router = Router();

const allowedRoles = new Set(["STUDENT", "COMPANY"]);

router.post("/register", async (req: Request, res: Response) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const role = typeof req.body.role === "string" ? req.body.role.toUpperCase() : "";
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!email || !password || !role) {
    return res.status(400).json({ error: "email, password and role required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (password.length < 10 || password.length > 72) {
    return res.status(400).json({ error: "Password must be between 10 and 72 characters" });
  }
  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: "Role must be STUDENT or COMPANY" });
  }
  if (name.length > 120) return res.status(400).json({ error: "Name is too long" });

  const hashed = await bcrypt.hash(password, 12);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role,
        ...(role === "STUDENT"
          ? { student: { create: { name } } }
          : { company: { create: { name } } }),
      },
    });
  } catch (error: any) {
    if (error?.code === "P2002") return res.status(409).json({ error: "User already exists" });
    throw error;
  }

  const token = generateToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, userId: user.id, role: user.role, email: user.email });
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = generateToken({ userId: user.id, role: user.role });
  res.json({ token, userId: user.id, role: user.role, email: user.email });
});

export default router;
