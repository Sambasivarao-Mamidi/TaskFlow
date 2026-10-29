import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
  } catch {
    // token invalid -> treat as unauthenticated, no error
  }
  next();
}

export function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.userId) {
    _res.status(401).json({
      error: { code: "unauthorized", message: "Authentication required" },
    });
    return;
  }
  next();
}
