/** Basic E.164: + followed by 8–15 digits (ITU-T E.164 max 15). */
const E164 = /^\+[1-9]\d{7,14}$/;

export function isValidE164Phone(raw: string | null | undefined): boolean {
  if (raw == null) return false;
  const s = raw.trim();
  if (!s) return false;
  return E164.test(s);
}

export function normalizeE164OrEmpty(raw: string | null | undefined): string {
  if (raw == null) return "";
  return raw.trim();
}
