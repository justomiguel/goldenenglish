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

export function compareIsoDate(a: string, b: string): number {
  return a.localeCompare(b);
}

export function maxIso(a: string, b: string): string {
  return compareIsoDate(a, b) >= 0 ? a : b;
}

export function minIso(a: string, b: string): string {
  return compareIsoDate(a, b) <= 0 ? a : b;
}
