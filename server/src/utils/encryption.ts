import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const hex = process.env.AI_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("AI_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)");
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(ciphertextWithMeta: string): string {
  const key = getEncryptionKey();
  const parts = ciphertextWithMeta.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = Buffer.from(parts[2], "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function maskKey(key: string): string {
  if (!key || key.length < 8) {
    return "****";
  }
  return "****" + key.slice(-4);
}
