/**
 * Wall-clock times for institute sections are interpreted in America/Argentina/Cordoba (no DST).
 * UTC offset is fixed −03:00 → local civil time + 3h for the same instant in UTC.
 */
export function cordobaWallClockToUtcMs(y: number, month: number, day: number, hh: number, mm: number): number {
  return Date.UTC(y, month - 1, day, hh + 3, mm, 0);
}
