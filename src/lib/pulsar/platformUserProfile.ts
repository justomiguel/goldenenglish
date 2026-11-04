import { normalizePhone, phoneHref } from "@/lib/pulsar/freeSiteShare";

const PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

/** A blank phone clears the account field. A bad value does not save. */
export function parseProfilePhone(value: string): { ok: true; phone: string } | { ok: false } {
  const phone = normalizePhone(value);
  if (!phone) return { ok: true, phone: "" };
  if (!phoneHref(phone)) return { ok: false };
  return { ok: true, phone };
}

export function parseProfileDisplayName(value: string): { ok: true; name: string } | { ok: false } {
  const name = value.trim();
  if (name.length < 1 || name.length > 80) return { ok: false };
  return { ok: true, name };
}

export function decodeProfilePhoto(
  base64: string,
  mime: string,
): { ok: true; bytes: Buffer; mime: string } | { ok: false } {
  if (!PHOTO_MIME.has(mime)) return { ok: false };
  const cleaned = base64.replace(/\s/g, "");
  if (cleaned.length === 0 || cleaned.length > 21_000_000) return { ok: false };
  if (!/^[A-Za-z0-9+/]+=*$/.test(cleaned)) return { ok: false };
  const bytes = Buffer.from(cleaned, "base64");
  if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES) return { ok: false };
  return { ok: true, bytes, mime };
}
