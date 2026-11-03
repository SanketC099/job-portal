import jwt, { SignOptions } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
  }
  return secret || "local-development-only-secret-change-before-production";
}

export const generateToken = (payload: object, expiresIn: SignOptions["expiresIn"] = "2d"): string =>
  jwt.sign(payload, getJwtSecret(), { expiresIn, algorithm: "HS256" });

function verifyToken(token: string): object {
  return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as object;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    (req as any).auth = verifyToken(header.slice("Bearer ".length));
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      (req as any).auth = verifyToken(header.slice("Bearer ".length));
    } catch {
      // Invalid optional tokens do not block public job browsing.
    }
  }
  next();
};
