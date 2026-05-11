/** Calendar validation for birth-date triplets (no framework imports). */

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function daysInCalendarMonth(year: number, month1to12: number): number {
  if (month1to12 < 1 || month1to12 > 12) return 31;
  return new Date(year, month1to12, 0).getDate();
}

export function parseIsoBirthDateParts(
  iso: string,
): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(mo) ||
    !Number.isFinite(d) ||
    y < 1000 ||
    mo < 1 ||
    mo > 12 ||
    d < 1
  )
    return null;
  const maxDay = daysInCalendarMonth(y, mo);
  if (d > maxDay) return null;
  return { y, m: mo, d };
}

/** Returns ISO yyyy-mm-dd or null when parts are incomplete or impossible / out of allowed window. */
export function isoDateFromBirthTripletParts(
  year: number | null,
  month1to12: number | null,
  day: number | null,
  now: Date = new Date(),
  maxPastYears = 120,
): string | null {
  if (
    year == null ||
    month1to12 == null ||
    day == null ||
    !Number.isFinite(year) ||
    !Number.isFinite(month1to12) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  const y = Math.floor(year);
  const m = Math.floor(month1to12);
  const dt = Math.floor(day);
  const maxDay = daysInCalendarMonth(y, m);
  if (m < 1 || m > 12 || dt < 1 || dt > maxDay) return null;

  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const chosenMs = Date.UTC(y, m - 1, dt);

  const yMin = new Date(todayMs).getUTCFullYear() - maxPastYears;
  const minUtc = Date.UTC(yMin, 0, 1);
  if (chosenMs < minUtc || chosenMs > todayMs) return null;

  return `${y}-${pad2(m)}-${pad2(dt)}`;
}

/** Local-calendar Date at noon (avoids TZ surprises with DayPicker). */
export function localNoonDateFromIsoYmd(iso: string): Date | undefined {
  const p = parseIsoBirthDateParts(iso);
  if (!p) return undefined;
  return new Date(p.y, p.m - 1, p.d, 12, 0, 0, 0);
}

/** yyyy-mm-dd from a local-calendar Date instance. */
export function isoYmdFromLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
