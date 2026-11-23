import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const PREFIX = "geoa:v1";

function assertKey32(key: Buffer): void {
  if (key.length !== 32) {
    throw new Error("openai_encryption_unavailable");
  }
}

/** AES-256-GCM wire format: geoa:v1:ivB64:tagB64:cipherB64 */
export function encryptOpenAiKey(plain: string, rawKey32: Buffer): string {
  assertKey32(rawKey32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", rawKey32, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptOpenAiKey(payload: string, rawKey32: Buffer): string {
  assertKey32(rawKey32);
  const parts = payload.split(":");
  if (parts.length !== 5 || parts[0] !== "geoa" || parts[1] !== "v1") {
    throw new Error("openai_key_corrupt");
  }
  try {
    const iv = Buffer.from(parts[2]!, "base64");
    const tag = Buffer.from(parts[3]!, "base64");
    const data = Buffer.from(parts[4]!, "base64");
    const decipher = createDecipheriv("aes-256-gcm", rawKey32, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch (err) {
    if (err instanceof Error && err.message === "openai_key_corrupt") throw err;
    throw new Error("openai_key_corrupt");
  }
}
