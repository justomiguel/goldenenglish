/** View month clamps for bounded birth-date calendar navigation (no framework imports). */

export function startOfUtcMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function clampBirthCalendarViewMonth(month: Date, earliest: Date, latest: Date) {
  const monthStart = startOfUtcMonth(month);
  if (monthStart < earliest) return startOfUtcMonth(earliest);
  if (monthStart > latest) return latest;
  return monthStart;
}
