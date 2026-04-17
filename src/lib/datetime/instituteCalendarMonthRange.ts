/** Calendar Y-M-D parts for `timeZone` (IANA), e.g. from `analytics.timezone` in `system.properties`. */
export function instituteCalendarPartsInTimeZone(now: Date, timeZone: string): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type === "year" || p.type === "month" || p.type === "day") map[p.type] = p.value;
  }
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day) };
}

/** Inclusive YYYY-MM-DD bounds for the institute calendar month containing `now`. */
export function instituteMonthYmdRangeInTimeZone(now: Date, timeZone: string): { start: string; end: string } {
  const { y, m } = instituteCalendarPartsInTimeZone(now, timeZone);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const mi = m - 1;
  const last = new Date(Date.UTC(y, mi + 1, 0)).getUTCDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}
