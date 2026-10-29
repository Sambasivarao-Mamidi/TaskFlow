import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour fixed window
const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetInMs: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetInMs = entry.windowStart + RATE_LIMIT_WINDOW_MS - now;
    return { allowed: false, remaining: 0, resetInMs: resetInMs > 0 ? resetInMs : 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetInMs: entry.windowStart + RATE_LIMIT_WINDOW_MS - now };
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as Request & { userId?: string };
  const userId = authReq.userId;
  if (!userId) {
    next();
    return;
  }

  const result = checkRateLimit(userId);
  res.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  res.set("X-RateLimit-Remaining", String(result.remaining));
  res.set("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + Math.ceil(result.resetInMs / 1000)));

  if (!result.allowed) {
    res.status(429).json({
      error: { code: "rate_limited", message: "Too many requests. Try again later.", details: { resetInMs: result.resetInMs } },
    });
    return;
  }
  next();
}
