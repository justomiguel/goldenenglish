import { createHash } from "node:crypto";

const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function hashSeatHoldToken(token: string | null | undefined): string | null {
  const trimmed = token?.trim() ?? "";
  if (!TOKEN_PATTERN.test(trimmed)) return null;
  return createHash("sha256").update(trimmed).digest("hex");
}
