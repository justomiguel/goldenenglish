/** Flatten theme JSONB `properties` to string values only (runtime merge uses the same shape). */
export function parseSiteThemePropertyStrings(
  raw: unknown,
): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
