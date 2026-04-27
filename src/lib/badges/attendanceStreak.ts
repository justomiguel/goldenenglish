/**
 * Longest run of calendar days (UTC date) where each day follows the previous by +1 day.
 * @param sortedUniqueYmd — ISO `YYYY-MM-DD` sorted ascending, unique
 */
export function maxConsecutiveCalendarDayStreak(sortedUniqueYmd: string[]): number {
  if (sortedUniqueYmd.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < sortedUniqueYmd.length; i++) {
    const prev = sortedUniqueYmd[i - 1]!;
    const day = sortedUniqueYmd[i]!;
    if (isNextCalendarDayUtc(prev, day)) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
}

function isNextCalendarDayUtc(ymdPrev: string, ymdNext: string): boolean {
  const a = parseUtcDateOnly(ymdPrev);
  const b = parseUtcDateOnly(ymdNext);
  if (!a || !b) return false;
  const diff = (b.getTime() - a.getTime()) / 86_400_000;
  return diff === 1;
}

function parseUtcDateOnly(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
