const MIN = 1;
const MAX = 120;
const FALLBACK = 18;

/** Pure: takes the `site_settings.value` JSONB and returns a bounded integer.
 *  Accepts the canonical shape `{ value: number }` and falls back to defaults
 *  when the row is missing or malformed.
 */
export function parseLegalAgeMajority(
  raw: unknown,
  defaultValue: number = FALLBACK,
): number {
  if (raw && typeof raw === "object") {
    const v = (raw as Record<string, unknown>).value;
    if (typeof v === "number" && Number.isFinite(v) && v >= MIN && v <= MAX) {
      return Math.trunc(v);
    }
    if (typeof v === "string") {
      const n = Number.parseInt(v, 10);
      if (Number.isFinite(n) && n >= MIN && n <= MAX) return n;
    }
  }
  if (Number.isFinite(defaultValue) && defaultValue >= MIN && defaultValue <= MAX) {
    return Math.trunc(defaultValue);
  }
  return FALLBACK;
}
