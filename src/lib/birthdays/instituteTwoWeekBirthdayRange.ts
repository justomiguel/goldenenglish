import { instituteCalendarDateIso } from "@/lib/datetime/instituteCalendarDateIso";
import { instituteWeekday0SunFromYmd } from "@/lib/datetime/instituteCalendarDateIso";
import { INSTITUTE_CALENDAR_TIMEZONE } from "@/lib/birthdays/instituteCalendarTz";

function addDaysToIsoYmd(startIso: string, deltaDays: number): string {
  const [y, m, d] = startIso.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return startIso;
  const ms = Date.UTC(y, m - 1, d + deltaDays, 12, 0, 0, 0);
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Monday–Sunday current week + following week (14 civil days in institute TZ), inclusive end.
 * Used for the dashboard “upcoming birthdays” card.
 */
export function instituteTwoWeekBirthdayRange(now: Date = new Date()): { startIso: string; endIso: string } {
  const tz = INSTITUTE_CALENDAR_TIMEZONE;
  const todayIso = instituteCalendarDateIso(now, tz);
  const wd0Sun = instituteWeekday0SunFromYmd(todayIso, tz);
  const daysFromMonday = (wd0Sun + 6) % 7;
  const weekStartIso = addDaysToIsoYmd(todayIso, -daysFromMonday);
  const endIso = addDaysToIsoYmd(weekStartIso, 13);
  return { startIso: weekStartIso, endIso };
}
