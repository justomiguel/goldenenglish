import type { SectionScheduleSlot } from "@/types/academics";
import { getAdminAttendanceMatrixFallbackLookbackDays } from "@/lib/academics/academicsAttendanceMatrixProperties";
import { sectionCalendarDateIsoOrNull } from "@/lib/academics/pgDateToInputValue";
import { addUtcCalendarDaysIso, utcCalendarDateIso } from "@/lib/academics/sectionAttendanceDateWindow";
import { isoDateMatchesSectionScheduleSlots } from "@/lib/academics/teacherAttendanceClassDayMatch";
import { instituteCalendarDateIso } from "@/lib/datetime/instituteCalendarDateIso";

export { addUtcCalendarDaysIso } from "@/lib/academics/sectionAttendanceDateWindow";
export {
  countClassDaysBetween,
  hasEligibleClassDayInWindow,
  isoDateMatchesSectionScheduleSlots,
  listAttendanceClassDaysNewestCapped,
  listTeacherAttendanceClassDaysIso,
  pickEligibleAttendanceDateIso,
} from "@/lib/academics/teacherAttendanceClassDayMatch";

/** Later of `civilFloorIso` and valid `sectionStartsOn` (operational window vs section start). */
export function effectiveAttendanceDateMinIso(
  civilFloorIso: string,
  sectionStartsOn: string | null | undefined,
): string {
  const s = sectionCalendarDateIsoOrNull(sectionStartsOn);
  if (!s) return civilFloorIso;
  return s > civilFloorIso ? s : civilFloorIso;
}

export function effectiveAttendanceDateMaxIso(
  today: string,
  sectionEndsOn: string | null | undefined,
): string {
  const e = sectionCalendarDateIsoOrNull(sectionEndsOn);
  if (!e) return today;
  return e < today ? e : today;
}

/**
 * Upper bound for **admin** matrix **columns**: the full section period through `ends_on` when set
 * (so March–November shows all scheduled class days, including future ones within the term).
 * When `ends_on` is missing, columns stop at today (same as {@link effectiveAttendanceDateMaxIso}).
 * Writes are still gated by {@link isAdminMatrixAttendanceDateAllowed} (no marks after today).
 */
export function adminAttendanceMatrixColumnMaxIso(
  todayIso: string,
  sectionEndsOn: string | null | undefined,
): string {
  const e = sectionCalendarDateIsoOrNull(sectionEndsOn);
  if (!e) return todayIso;
  return e;
}

/** Earliest date to scan for class-day columns (clamped to section `starts_on` when valid). */
export function teacherAttendanceMatrixScanMinIso(
  floorIso: string,
  sectionStartsOn: string | null | undefined,
  bufferDays: number,
): string {
  const s = sectionCalendarDateIsoOrNull(sectionStartsOn);
  const startBound = s ?? "1970-01-01";
  const extended = addUtcCalendarDaysIso(floorIso, -bufferDays);
  return extended < startBound ? startBound : extended;
}

/**
 * Whether a teacher may **persist** attendance on `dateIso`: within the section period up to **today**,
 * on a scheduled class day. Past dates in the term are allowed (no “last 2 days only” rule at app layer).
 * RLS still bounds writes in Postgres (wide institute-local past window; see `045_section_attendance_teacher_institute_window.sql`).
 */
export function isTeacherAttendanceDateAllowedForSection(
  dateIso: string,
  now: Date,
  input: {
    sectionStartsOn: string | null | undefined;
    sectionEndsOn: string | null | undefined;
    scheduleSlots: SectionScheduleSlot[];
    /** When set, “today” and weekday matching use this zone (see `analytics.timezone`). */
    calendarTimeZone?: string;
  },
): boolean {
  if (input.scheduleSlots.length === 0) return false;
  const tz = input.calendarTimeZone;
  const today = tz ? instituteCalendarDateIso(now, tz) : utcCalendarDateIso(now);
  if (dateIso > today) return false;
  const effMin = adminAttendanceMatrixEffMinIso(today, input.sectionStartsOn);
  const effMax = effectiveAttendanceDateMaxIso(today, input.sectionEndsOn);
  if (dateIso < effMin || dateIso > effMax) return false;
  if (!isoDateMatchesSectionScheduleSlots(dateIso, input.scheduleSlots, tz)) return false;
  return true;
}

/** Admin matrix lower bound: section start when set, else lookback from `system.properties` (`academics.attendance.matrix.admin.fallbackLookbackDays`). */
export function adminAttendanceMatrixEffMinIso(
  todayIso: string,
  sectionStartsOn: string | null | undefined,
): string {
  const s = sectionCalendarDateIsoOrNull(sectionStartsOn);
  if (!s) {
    return addUtcCalendarDaysIso(todayIso, -getAdminAttendanceMatrixFallbackLookbackDays());
  }
  return s;
}

/** Admin matrix: class day in section period (from section start through today), not the teacher 2-day rule. */
export function isAdminMatrixAttendanceDateAllowed(
  dateIso: string,
  now: Date,
  sectionStartsOn: string | null | undefined,
  sectionEndsOn: string | null | undefined,
  scheduleSlots: SectionScheduleSlot[],
  weekdayTimeZone?: string,
): boolean {
  if (scheduleSlots.length === 0) return false;
  const today = weekdayTimeZone ? instituteCalendarDateIso(now, weekdayTimeZone) : utcCalendarDateIso(now);
  if (dateIso > today) return false;
  const effMin = adminAttendanceMatrixEffMinIso(today, sectionStartsOn);
  const effMax = effectiveAttendanceDateMaxIso(today, sectionEndsOn);
  if (dateIso < effMin || dateIso > effMax) return false;
  return isoDateMatchesSectionScheduleSlots(dateIso, scheduleSlots, weekdayTimeZone);
}
