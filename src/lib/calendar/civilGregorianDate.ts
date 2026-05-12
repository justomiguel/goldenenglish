/** Weekday 0=Sunday … 6=Saturday for a civil Y-M-D (Gregorian), independent of server local TZ. */
export function civilWeekdayUtcNoon(y: number, month: number, day: number): number {
  return new Date(Date.UTC(y, month - 1, day, 12, 0, 0)).getUTCDay();
}

export function parseIsoDateParts(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** Gregorian YYYY-MM-DD from a UTC instant (uses `getUTC*`; for all-day ranges built with UTC noon). */
export function formatIsoDateUtcFromMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add calendar days to a date-only ISO string; walks via UTC noon to avoid DST issues. */
export function addCalendarDaysToIsoDate(isoYmd: string, deltaDays: number): string | null {
  const p = parseIsoDateParts(isoYmd);
  if (!p) return null;
  const t = Date.UTC(p.y, p.m - 1, p.d, 12, 0, 0) + deltaDays * 86400000;
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Inclusive range; `cb` receives YYYY-MM-DD strings. */
export function forEachIsoDateInRange(
  startIso: string,
  endIso: string,
  cb: (iso: string, y: number, m: number, d: number) => void,
): void {
  const a = parseIsoDateParts(startIso);
  const b = parseIsoDateParts(endIso);
  if (!a || !b) return;
  let t = Date.UTC(a.y, a.m - 1, a.d, 12, 0, 0);
  const endT = Date.UTC(b.y, b.m - 1, b.d, 12, 0, 0);
  while (t <= endT) {
    const dt = new Date(t);
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    const d = dt.getUTCDate();
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cb(iso, y, m, d);
    t += 86400000;
  }
}

/**
 * Render a civil date (YYYY-MM-DD; no zone) consistently across server/client.
 *
 * Why this exists: `new Date("2010-06-13")` is parsed as UTC midnight, so when
 * the environment that formats it sits west of UTC (e.g. America/Argentina/Cordoba,
 * UTC-3) the output shifts to the previous day. Birth dates, registration dates,
 * etc. are *civil* dates without a zone — the wall-clock day must survive any
 * server timezone. Format in `timeZone: "UTC"` so the formatter never shifts.
 */
export function formatCivilIsoDateForDisplay(
  locale: string,
  isoYmd: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string | null {
  if (!isoYmd) return null;
  const trimmed = String(isoYmd).slice(0, 10);
  const p = parseIsoDateParts(trimmed);
  if (!p) return null;
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0, 0));
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(d);
}

export function compareIsoDate(a: string, b: string): number {
  return a.localeCompare(b);
}

export function maxIso(a: string, b: string): string {
  return compareIsoDate(a, b) >= 0 ? a : b;
}

export function minIso(a: string, b: string): string {
  return compareIsoDate(a, b) <= 0 ? a : b;
}
