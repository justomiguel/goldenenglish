export function parsePlainText(
  raw: unknown,
  max: number,
): { ok: true; text: string } | { ok: false; code: "empty" | "too_long" } {
  if (typeof raw !== "string") return { ok: false, code: "empty" };
  const text = raw.trim();
  if (text.length < 1) return { ok: false, code: "empty" };
  if (text.length > max) return { ok: false, code: "too_long" };
  return { ok: true, text };
}
