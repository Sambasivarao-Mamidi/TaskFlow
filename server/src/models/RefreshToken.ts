import { Schema, model, Document, Types } from "mongoose";
import crypto from "crypto";

export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const RefreshToken = model<IRefreshToken>("RefreshToken", refreshTokenSchema);
