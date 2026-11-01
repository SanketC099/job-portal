import jwt, { Secret, SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";

dotenv.config();

const JWT_SECRET: Secret = process.env.JWT_SECRET || "supersecretdevkey";

export const generateToken = (payload: object, expiresIn: string = "2d"): string => {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Middleware: requires a valid JWT in the Authorization header.
 * Populates req.auth with the decoded payload { userId, role }.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).auth = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Middleware: same as authenticate but does NOT reject unauthenticated requests.
 * If a valid token is present, req.auth is set. Otherwise req.auth stays undefined.
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).auth = decoded;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
};
