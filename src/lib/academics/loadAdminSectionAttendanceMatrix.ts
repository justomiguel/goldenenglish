import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminAttendanceMatrixMaxClassDays } from "@/lib/academics/academicsAttendanceMatrixProperties";
import { utcCalendarDateIso } from "@/lib/academics/sectionAttendanceDateWindow";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import {
  adminAttendanceMatrixColumnMaxIso,
  adminAttendanceMatrixEffMinIso,
  countClassDaysBetween,
} from "@/lib/academics/teacherSectionAttendanceCalendar";
import {
  loadTeacherSectionAttendanceMatrix,
  type TeacherAttendanceClassDayListMode,
} from "@/lib/dashboard/loadTeacherSectionAttendanceMatrix";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import type { TeacherAttendanceMatrixPayload } from "@/types/teacherAttendanceMatrix";

export async function loadAdminSectionAttendanceMatrix(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<TeacherAttendanceMatrixPayload> {
  const { data: section, error: sectionError } = await supabase
    .from("academic_sections")
    .select("starts_on, ends_on, schedule_slots")
    .eq("id", sectionId)
    .maybeSingle();

  if (sectionError || !section) {
    return { classDays: [], classDaysTruncated: false, rows: [], cells: {}, holidayLabels: {} };
  }

  const todayIso = utcCalendarDateIso();
  const scheduleSlots = parseSectionScheduleSlots(section.schedule_slots);
  const effMin = adminAttendanceMatrixEffMinIso(todayIso, section.starts_on);
  const effMax = adminAttendanceMatrixColumnMaxIso(todayIso, section.ends_on);

  const instituteTz = getInstituteTimeZone();
  const adminMaxClassDays = getAdminAttendanceMatrixMaxClassDays();
  const totalClassDays = countClassDaysBetween(effMin, effMax, scheduleSlots, instituteTz);
  const classDayListMode: TeacherAttendanceClassDayListMode =
    totalClassDays > adminMaxClassDays ? "newest_capped" : "asc";

  return loadTeacherSectionAttendanceMatrix(supabase, sectionId, {
    effMin,
    effMax,
    scheduleSlots,
    weekdayTimeZone: instituteTz,
    maxClassDays: adminMaxClassDays,
    classDayListMode,
    cellEligibility: "all",
  });
}
