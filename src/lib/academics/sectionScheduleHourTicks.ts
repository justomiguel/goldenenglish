/** Full-hour marks (minutes from midnight) within `[windowStart, windowEnd]`. */
export function listSectionScheduleHourTicks(
  windowStartMinutes: number,
  windowEndMinutes: number,
): number[] {
  const start = Math.max(0, Math.min(24 * 60, windowStartMinutes));
  const end = Math.max(start, Math.min(24 * 60, windowEndMinutes));
  const first = Math.ceil(start / 60) * 60;
  const ticks: number[] = [];
  for (let t = first; t <= end; t += 60) {
    ticks.push(t);
  }
  return ticks;
}
