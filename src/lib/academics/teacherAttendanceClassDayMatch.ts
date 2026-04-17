import type { SectionScheduleSlot } from "@/types/academics";
import {
  getAttendanceMatrixHasEligibleWindowMaxScans,
  getAttendanceMatrixPickAdjacentCivilDays,
} from "@/lib/academics/academicsAttendanceMatrixProperties";
import { addUtcCalendarDaysIso } from "@/lib/academics/sectionAttendanceDateWindow";
import { instituteWeekday0SunFromYmd } from "@/lib/datetime/instituteCalendarDateIso";

/**
 * True when civil `dateIso` matches at least one slot weekday (0=Sun..6=Sat, same as section editor).
 * With `weekdayTimeZone`, weekday is resolved in that IANA zone; otherwise UTC (legacy).
 */
export function isoDateMatchesSectionScheduleSlots(
  dateIso: string,
  slots: SectionScheduleSlot[],
  weekdayTimeZone?: string,
): boolean {
  if (slots.length === 0) return true;
  const dow = weekdayTimeZone
    ? instituteWeekday0SunFromYmd(dateIso, weekdayTimeZone)
    : new Date(`${dateIso}T12:00:00.000Z`).getUTCDay();
  return slots.some((s) => s.dayOfWeek === dow);
}

/**
 * Clamp to [minIso, maxIso], then move to a nearby date that matches schedule (if any slots).
 */
export function hasEligibleClassDayInWindow(
  minIso: string,
  maxIso: string,
  slots: SectionScheduleSlot[],
  weekdayTimeZone?: string,
): boolean {
  if (minIso > maxIso) return false;
  if (slots.length === 0) return false;
  const maxScans = getAttendanceMatrixHasEligibleWindowMaxScans();
  let d = minIso;
  for (let guard = 0; guard < maxScans && d <= maxIso; guard++) {
    if (isoDateMatchesSectionScheduleSlots(d, slots, weekdayTimeZone)) return true;
    d = addUtcCalendarDaysIso(d, 1);
  }
  return false;
}

/**
 * Lists civil dates in [minIso, maxIso] that match `schedule_slots` weekdays.
 * Stops after `maxDays` entries; `truncated` is true if another matching day still exists before `maxIso`.
 */
export function listTeacherAttendanceClassDaysIso(
  minIso: string,
  maxIso: string,
  slots: SectionScheduleSlot[],
  maxDays: number,
  weekdayTimeZone?: string,
): { days: string[]; truncated: boolean } {
  if (minIso > maxIso) return { days: [], truncated: false };
  if (slots.length === 0) return { days: [], truncated: false };
  const days: string[] = [];
  let d = minIso;
  while (d <= maxIso) {
    if (isoDateMatchesSectionScheduleSlots(d, slots, weekdayTimeZone)) {
      days.push(d);
      if (days.length >= maxDays) {
        let rest = addUtcCalendarDaysIso(d, 1);
        while (rest <= maxIso) {
          if (isoDateMatchesSectionScheduleSlots(rest, slots, weekdayTimeZone)) {
            return { days, truncated: true };
          }
          rest = addUtcCalendarDaysIso(rest, 1);
        }
        return { days, truncated: false };
      }
    }
    d = addUtcCalendarDaysIso(d, 1);
  }
  return { days, truncated: false };
}

/** Counts class days in [minIso, maxIso] (inclusive) matching `slots` (single pass, no array). */
export function countClassDaysBetween(
  minIso: string,
  maxIso: string,
  slots: SectionScheduleSlot[],
  weekdayTimeZone?: string,
): number {
  if (minIso > maxIso || slots.length === 0) return 0;
  let n = 0;
  let d = minIso;
  while (d <= maxIso) {
    if (isoDateMatchesSectionScheduleSlots(d, slots, weekdayTimeZone)) n += 1;
    d = addUtcCalendarDaysIso(d, 1);
  }
  return n;
}

/**
 * Class days in [minIso, maxIso] walking **backwards** from maxIso, keeping at most `maxDays`
 * (most recent sessions first). Returned `days` are ascending for column order.
 */
export function listAttendanceClassDaysNewestCapped(
  minIso: string,
  maxIso: string,
  slots: SectionScheduleSlot[],
  maxDays: number,
  weekdayTimeZone?: string,
): { days: string[]; truncated: boolean } {
  if (minIso > maxIso || slots.length === 0) return { days: [], truncated: false };
  const acc: string[] = [];
  let d = maxIso;
  while (d >= minIso && acc.length < maxDays) {
    if (isoDateMatchesSectionScheduleSlots(d, slots, weekdayTimeZone)) acc.push(d);
    d = addUtcCalendarDaysIso(d, -1);
  }
  acc.reverse();
  if (acc.length === 0) return { days: [], truncated: false };
  const oldest = acc[0]!;
  let truncated = false;
  let scan = addUtcCalendarDaysIso(oldest, -1);
  while (scan >= minIso) {
    if (isoDateMatchesSectionScheduleSlots(scan, slots, weekdayTimeZone)) {
      truncated = true;
      break;
    }
    scan = addUtcCalendarDaysIso(scan, -1);
  }
  return { days: acc, truncated };
}

export function pickEligibleAttendanceDateIso(
  requested: string,
  minIso: string,
  maxIso: string,
  slots: SectionScheduleSlot[],
  weekdayTimeZone?: string,
): { dateIso: string; adjustedFromRequested: boolean } {
  const initial = requested;
  let d = requested;
  if (d < minIso) d = minIso;
  else if (d > maxIso) d = maxIso;

  if (slots.length === 0) {
    return { dateIso: d, adjustedFromRequested: d !== initial };
  }

  if (isoDateMatchesSectionScheduleSlots(d, slots, weekdayTimeZone)) {
    return { dateIso: d, adjustedFromRequested: d !== initial };
  }

  const adjacent = getAttendanceMatrixPickAdjacentCivilDays();
  for (let i = 1; i <= adjacent; i++) {
    const next = addUtcCalendarDaysIso(d, i);
    if (next > maxIso) break;
    if (isoDateMatchesSectionScheduleSlots(next, slots, weekdayTimeZone)) {
      return { dateIso: next, adjustedFromRequested: true };
    }
  }
  for (let i = 1; i <= adjacent; i++) {
    const prev = addUtcCalendarDaysIso(d, -i);
    if (prev < minIso) break;
    if (isoDateMatchesSectionScheduleSlots(prev, slots, weekdayTimeZone)) {
      return { dateIso: prev, adjustedFromRequested: true };
    }
  }

  return { dateIso: d, adjustedFromRequested: d !== initial };
}
