import { addUtcCalendarDaysIso } from "@/lib/academics/sectionAttendanceDateWindow";
import { instituteCalendarDateIso, instituteWeekday0SunFromYmd } from "@/lib/datetime/instituteCalendarDateIso";
import {
  instituteCalendarPartsInTimeZone,
  instituteMonthYmdRangeInTimeZone,
} from "@/lib/datetime/instituteCalendarMonthRange";
import { instituteZonedDateTimeUtc } from "@/lib/register/trialSeatClassWindow";
import type { SectionScheduleSlot } from "@/types/academics";

export function sectionHasRemainingClassThisMonth(input: {
  slots: SectionScheduleSlot[];
  startsOn: string | null;
  endsOn: string | null;
  now: Date;
  timeZone: string;
}): boolean {
  if (input.slots.length === 0) return false;
  const today = instituteCalendarDateIso(input.now, input.timeZone);
  const { end: monthEnd } = instituteMonthYmdRangeInTimeZone(input.now, input.timeZone);
  const startsOn = input.startsOn?.slice(0, 10) || null;
  const endsOn = input.endsOn?.slice(0, 10) || null;
  let from = today;
  if (startsOn && startsOn > from) from = startsOn;
  let to = monthEnd;
  if (endsOn && endsOn < to) to = endsOn;
  if (from > to) return false;

  let day = from;
  while (day <= to) {
    const dow = instituteWeekday0SunFromYmd(day, input.timeZone);
    for (const slot of input.slots) {
      if (slot.dayOfWeek !== dow) continue;
      const start = instituteZonedDateTimeUtc(day, slot.startTime, input.timeZone);
      if (!Number.isNaN(start.getTime()) && start.getTime() >= input.now.getTime()) {
        return true;
      }
    }
    day = addUtcCalendarDaysIso(day, 1);
  }
  return false;
}

export function instituteYearMonth(now: Date, timeZone: string): { year: number; month: number } {
  const { y, m } = instituteCalendarPartsInTimeZone(now, timeZone);
  return { year: y, month: m };
}
