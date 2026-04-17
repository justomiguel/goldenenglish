import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeacherAttendanceMatrixPayload } from "@/types/teacherAttendanceMatrix";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { formatAcademicScheduleSummary } from "@/lib/academics/formatAcademicScheduleSummary";
import {
  getTeacherAttendanceMatrixScanLookbackBufferDays,
  getTeacherAttendanceOperationalCivilLookbackDays,
  getTeacherAttendanceOperationalMaxClassDays,
} from "@/lib/academics/academicsAttendanceMatrixProperties";
import {
  addUtcCalendarDaysIso,
  adminAttendanceMatrixColumnMaxIso,
  adminAttendanceMatrixEffMinIso,
  effectiveAttendanceDateMaxIso,
  effectiveAttendanceDateMinIso,
  hasEligibleClassDayInWindow,
  isTeacherAttendanceDateAllowedForSection,
  teacherAttendanceMatrixScanMinIso,
} from "@/lib/academics/teacherSectionAttendanceCalendar";
import { instituteCalendarDateIso } from "@/lib/datetime/instituteCalendarDateIso";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { loadTeacherSectionAttendanceMatrix } from "@/lib/dashboard/loadTeacherSectionAttendanceMatrix";

export type TeacherAttendanceScopeKey = "full" | "operational";

export interface PreparedTeacherSectionAttendancePage {
  scope: TeacherAttendanceScopeKey;
  scheduleLine: string;
  dateWindowOk: boolean;
  hasScheduleSlots: boolean;
  canShowMatrixShell: boolean;
  hasEligibleOperational: boolean;
  hasEligibleFull: boolean;
  hasEligibleForScope: boolean;
  matrix: TeacherAttendanceMatrixPayload | null;
  editableByDate: Record<string, boolean>;
  todayIso: string;
}

export async function prepareTeacherSectionAttendancePage(input: {
  supabase: SupabaseClient;
  sectionId: string;
  scope: TeacherAttendanceScopeKey;
  locale: string;
  scheduleSummaryLead: string;
  section: { starts_on?: string | null; ends_on?: string | null; schedule_slots?: unknown };
}): Promise<PreparedTeacherSectionAttendancePage> {
  const { supabase, sectionId, scope, locale, scheduleSummaryLead, section } = input;
  const now = new Date();
  const instituteTz = getInstituteTimeZone();
  const today = instituteCalendarDateIso(now, instituteTz);
  const scheduleSlots = parseSectionScheduleSlots(section.schedule_slots);
  const sectionStartsOn = section.starts_on ?? null;
  const sectionEndsOn = section.ends_on ?? null;
  const matrixColumnMax = adminAttendanceMatrixColumnMaxIso(today, sectionEndsOn);
  const editWindowMax = effectiveAttendanceDateMaxIso(today, sectionEndsOn);
  const operationalCivilMin = addUtcCalendarDaysIso(
    today,
    -getTeacherAttendanceOperationalCivilLookbackDays(),
  );
  const operationalFloorIso = effectiveAttendanceDateMinIso(operationalCivilMin, sectionStartsOn);
  const scheduleSummary = formatAcademicScheduleSummary(section.schedule_slots, locale);
  const scheduleLine = scheduleSummary ? `${scheduleSummaryLead} ${scheduleSummary}` : "";

  const fullCourseMin = adminAttendanceMatrixEffMinIso(today, sectionStartsOn);
  const dateWindowOk = fullCourseMin <= matrixColumnMax;
  const hasScheduleSlots = scheduleSlots.length > 0;
  const operationalScanMin = teacherAttendanceMatrixScanMinIso(
    operationalFloorIso,
    sectionStartsOn,
    getTeacherAttendanceMatrixScanLookbackBufferDays(),
  );
  const hasEligibleOperational =
    hasScheduleSlots &&
    hasEligibleClassDayInWindow(operationalScanMin, editWindowMax, scheduleSlots, instituteTz);
  const hasEligibleFull =
    hasScheduleSlots &&
    hasEligibleClassDayInWindow(fullCourseMin, matrixColumnMax, scheduleSlots, instituteTz);
  const canShowMatrixShell = dateWindowOk && hasScheduleSlots && (hasEligibleOperational || hasEligibleFull);

  const matrixMin = scope === "full" ? fullCourseMin : operationalScanMin;
  const matrixListMaxIso = scope === "operational" ? editWindowMax : matrixColumnMax;
  const hasEligibleForScope =
    hasScheduleSlots &&
    hasEligibleClassDayInWindow(matrixMin, matrixListMaxIso, scheduleSlots, instituteTz);

  const matrix =
    canShowMatrixShell && hasEligibleForScope
      ? await loadTeacherSectionAttendanceMatrix(supabase, sectionId, {
          effMin: matrixMin,
          effMax: matrixListMaxIso,
          scheduleSlots,
          weekdayTimeZone: instituteTz,
          maxClassDays: scope === "operational" ? getTeacherAttendanceOperationalMaxClassDays() : undefined,
          classDayListMode: scope === "operational" ? "newest_capped" : "asc",
          sectionStartsOn,
        })
      : null;

  const editableByDate: Record<string, boolean> = {};
  if (matrix?.classDays.length) {
    const bounds = {
      sectionStartsOn,
      sectionEndsOn,
      scheduleSlots,
      calendarTimeZone: instituteTz,
    };
    for (const day of matrix.classDays) {
      editableByDate[day] = isTeacherAttendanceDateAllowedForSection(day, now, bounds);
    }
  }

  return {
    scope,
    scheduleLine,
    dateWindowOk,
    hasScheduleSlots,
    canShowMatrixShell,
    hasEligibleOperational,
    hasEligibleFull,
    hasEligibleForScope,
    matrix,
    editableByDate,
    todayIso: today,
  };
}
