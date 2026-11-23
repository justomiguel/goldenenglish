import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const PREFIX = "geai:v1";

function assertKey32(key: Buffer): void {
  if (key.length !== 32) throw new Error("ai_encryption_unavailable");
}

function open(prefix: string, payload: string, rawKey32: Buffer): string {
  const parts = payload.split(":");
  if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== prefix) throw new Error("ai_key_corrupt");
  const iv = Buffer.from(parts[2] ?? "", "base64");
  const tag = Buffer.from(parts[3] ?? "", "base64");
  const data = Buffer.from(parts[4] ?? "", "base64");
  const decipher = createDecipheriv("aes-256-gcm", rawKey32, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function encryptAiKey(plain: string, rawKey32: Buffer): string {
  assertKey32(rawKey32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", rawKey32, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptAiKey(payload: string, rawKey32: Buffer): string {
  assertKey32(rawKey32);
  try {
    if (payload.startsWith("geoa:v1:")) return open("geoa:v1", payload, rawKey32);
    return open(PREFIX, payload, rawKey32);
  } catch (err) {
    if (err instanceof Error && err.message === "ai_encryption_unavailable") throw err;
    throw new Error("ai_key_corrupt");
  }
}
