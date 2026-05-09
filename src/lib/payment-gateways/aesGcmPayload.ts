import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const PREFIX = "gegw:v1";

function assertKey32(key: Buffer): void {
  if (key.length !== 32) {
    throw new Error("payment_gateway_encryption_key_must_be_32_bytes");
  }
}

/** AES-256-GCM wire format: gegw:v1:ivB64:tagB64:cipherB64 */
export function encryptAesGcmUtf8(plain: string, rawKey32: Buffer): string {
  assertKey32(rawKey32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", rawKey32, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptAesGcmUtf8(payload: string, rawKey32: Buffer): string {
  assertKey32(rawKey32);
  const parts = payload.split(":");
  if (parts.length !== 5 || parts[0] !== "gegw" || parts[1] !== "v1") {
    throw new Error("invalid_payment_gateway_payload");
  }
  const iv = Buffer.from(parts[2]!, "base64");
  const tag = Buffer.from(parts[3]!, "base64");
  const data = Buffer.from(parts[4]!, "base64");
  const decipher = createDecipheriv("aes-256-gcm", rawKey32, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
