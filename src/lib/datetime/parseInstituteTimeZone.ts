const DEFAULT_TZ = "America/Argentina/Cordoba";

/** Returns a non-empty IANA-style timezone string. The format isn't strictly
 *  validated (no comprehensive list in stdlib) — we sanitize whitespace and
 *  fall back to the default when the row is missing/empty. */
export function parseInstituteTimeZone(
  raw: unknown,
  defaultTz: string = DEFAULT_TZ,
): string {
  if (raw && typeof raw === "object") {
    const candidate = (raw as Record<string, unknown>).timezone;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return defaultTz.trim() || DEFAULT_TZ;
}

export const INSTITUTE_TIMEZONE_DEFAULT = DEFAULT_TZ;
