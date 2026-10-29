import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Router, Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { RefreshToken, hashToken } from "../models/RefreshToken";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { registerSchema, loginSchema } from "@taskflow/shared";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { createErrorResponse } from "@taskflow/shared";

const router = Router();

function issueTokens(userId: string) {
  const accessToken = signAccessToken({ userId });
  const refreshToken = signRefreshToken({ userId });
  return { accessToken, refreshToken };
}

async function createRefreshTokenRecord(
  userId: string,
  refreshToken: string
): Promise<string> {
  const tokenHash = hashToken(refreshToken);
  const familyId = cryptoRandomId();
  await RefreshToken.create({
    userId,
    familyId,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revoked: false,
  });
  return familyId;
}

function cryptoRandomId(): string {
  const buf = crypto.randomBytes(16);
  return buf.toString("hex");
}

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(
      createErrorResponse(
        "validation_error",
        "Invalid request",
        parsed.error.flatten().fieldErrors
      )
    );
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json(
      createErrorResponse("email_in_use", "Email already registered")
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const refreshToken = signRefreshToken({ userId: user._id.toString() });
  await createRefreshTokenRecord(user._id.toString(), refreshToken);
  const accessToken = signAccessToken({ userId: user._id.toString() });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user._id.toString(), name: user.name, email: user.email },
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(
      createErrorResponse(
        "validation_error",
        "Invalid request",
        parsed.error.flatten().fieldErrors
      )
    );
    return;
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    res.status(401).json(
      createErrorResponse("invalid_credentials", "Invalid email or password")
    );
    return;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    res.status(401).json(
      createErrorResponse("invalid_credentials", "Invalid email or password")
    );
    return;
  }

  const refreshToken = signRefreshToken({ userId: user._id.toString() });
  await createRefreshTokenRecord(user._id.toString(), refreshToken);
  const accessToken = signAccessToken({ userId: user._id.toString() });

  res.json({
    accessToken,
    refreshToken,
    user: { id: user._id.toString(), name: user.name, email: user.email },
  });
});

router.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(401).json(
      createErrorResponse("invalid_credentials", "Refresh token required")
    );
    return;
  }

  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json(
      createErrorResponse("invalid_credentials", "Invalid refresh token")
    );
    return;
  }

  const tokenHash = hashToken(refreshToken);
  const record = await RefreshToken.findOne({ tokenHash });
  if (!record || record.revoked || record.expiresAt < new Date()) {
    res.status(401).json(
      createErrorResponse("invalid_credentials", "Invalid refresh token")
    );
    return;
  }

  // Family-based reuse detection: revoke the whole family on reuse.
  // The hash of the presented token must match the current active record.
  // If it doesn't match, someone is replaying an old token.
  const current = await RefreshToken.findOne({
    familyId: record.familyId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });
  if (!current || current.tokenHash !== tokenHash) {
    await RefreshToken.updateMany(
      { familyId: record.familyId },
      { revoked: true }
    );
    res.status(401).json(
      createErrorResponse(
        "token_reuse_detected",
        "Refresh token reuse detected; family revoked"
      )
    );
    return;
  }

  // Rotate: revoke current family, issue new family.
  await RefreshToken.updateMany(
    { familyId: record.familyId },
    { revoked: true }
  );
  const newRefreshToken = signRefreshToken({ userId: payload.userId });
  const newFamilyId = await createRefreshTokenRecord(
    payload.userId,
    newRefreshToken
  );
  const accessToken = signAccessToken({ userId: payload.userId });

  const user = await User.findById(payload.userId).select("-passwordHash");

  res.json({
    accessToken,
    refreshToken: newRefreshToken,
    user: user
      ? { id: user._id.toString(), name: user.name, email: user.email }
      : null,
  });
});

router.post("/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const record = await RefreshToken.findOne({ tokenHash });
    if (record) {
      await RefreshToken.updateMany(
        { familyId: record.familyId },
        { revoked: true }
      );
    }
  }
  res.json({ message: "Logged out" });
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    res.status(401).json(
      createErrorResponse("unauthorized", "Authentication required")
    );
    return;
  }

  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) {
    res.status(404).json(createErrorResponse("not_found", "User not found"));
    return;
  }

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  });
});

export default router;
