import { instituteCalendarPartsInTimeZone } from "@/lib/datetime/instituteCalendarMonthRange";

/** Civil YYYY-MM-DD for `now` in `timeZone` (IANA). */
export function instituteCalendarDateIso(now: Date, timeZone: string): string {
  const { y, m, d } = instituteCalendarPartsInTimeZone(now, timeZone);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Weekday 0=Sunday..6=Saturday for civil `dateIso` interpreted in `timeZone`
 * (anchor noon UTC on that label, then weekday in the zone — same pattern as schedule UI).
 */
export function instituteWeekday0SunFromYmd(dateIso: string, timeZone: string): number {
  const [y, mo, d] = dateIso.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return 0;
  const u = Date.UTC(y, mo - 1, d, 12, 0, 0);
  const long = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(new Date(u));
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
  const i = names.indexOf(long as (typeof names)[number]);
  return i === -1 ? new Date(u).getUTCDay() : i;
}
