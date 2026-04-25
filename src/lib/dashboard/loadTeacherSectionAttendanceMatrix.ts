import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import type { SectionScheduleSlot } from "@/types/academics";
import type { TeacherAttendanceMatrixPayload, TeacherAttendanceMatrixRow } from "@/types/teacherAttendanceMatrix";
import { enrollmentEligibleForAttendanceOnDate } from "@/lib/academics/sectionEnrollmentEligibleOnDate";
import {
  listAttendanceClassDaysNewestCapped,
  listTeacherAttendanceClassDaysIso,
} from "@/lib/academics/teacherAttendanceClassDayMatch";
import { getTeacherAttendanceFullCourseMaxClassDays } from "@/lib/academics/academicsAttendanceMatrixProperties";

export type TeacherAttendanceClassDayListMode = "asc" | "newest_capped";

/** `enrollment`: hide cells outside enrollment lifecycle. `all`: admin — every class day column is editable. */
export type TeacherAttendanceCellEligibility = "enrollment" | "all";

export async function loadTeacherSectionAttendanceMatrix(
  supabase: SupabaseClient,
  sectionId: string,
  input: {
    effMin: string;
    effMax: string;
    scheduleSlots: SectionScheduleSlot[];
    /** Match slot weekdays in this IANA zone (institute calendar). */
    weekdayTimeZone?: string;
    /** Defaults to `academics.attendance.matrix.teacher.fullCourseMaxClassDays` in system.properties. */
    maxClassDays?: number;
    /** `newest_capped`: most recent class sessions in the window (admin). Default: oldest-first (teacher). */
    classDayListMode?: TeacherAttendanceClassDayListMode;
    /** Default `enrollment`. */
    cellEligibility?: TeacherAttendanceCellEligibility;
    /**
     * Section start (YYYY-MM-DD). When set, active/completed enrollments become eligible from this
     * floor even if the enrollment row was created later (mid-term onboarding case).
     */
    sectionStartsOn?: string | null;
  },
): Promise<TeacherAttendanceMatrixPayload> {
  const cap = input.maxClassDays ?? getTeacherAttendanceFullCourseMaxClassDays();
  const mode = input.classDayListMode ?? "asc";
  const cellEligibility = input.cellEligibility ?? "enrollment";
  const tz = input.weekdayTimeZone;
  const sectionStartsOn = input.sectionStartsOn ?? null;
  const { days: classDays, truncated: classDaysTruncated } =
    mode === "newest_capped"
      ? listAttendanceClassDaysNewestCapped(input.effMin, input.effMax, input.scheduleSlots, cap, tz)
      : listTeacherAttendanceClassDaysIso(
          input.effMin,
          input.effMax,
          input.scheduleSlots,
          cap,
          tz,
        );

  if (classDays.length === 0) {
    return { classDays: [], classDaysTruncated, rows: [], cells: {}, holidayLabels: {} };
  }

  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("id, status, student_id, created_at, updated_at, profiles!student_id(first_name,last_name)")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: true });

  const raw = (enrollments ?? []) as {
    id: string;
    status: string;
    student_id: string;
    created_at: string;
    updated_at: string;
    profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  }[];

  const rows: TeacherAttendanceMatrixRow[] = raw.map((r) => {
    const pRaw = r.profiles;
    const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    const label = p ? `${p.first_name} ${p.last_name}`.trim() : r.student_id;
    return {
      enrollmentId: r.id,
      studentLabel: label,
      enrollmentStatus: String(r.status ?? ""),
      createdAt: String(r.created_at ?? ""),
      updatedAt: String(r.updated_at ?? ""),
    };
  });

  const byEnrollmentId = new Map(rows.map((r) => [r.enrollmentId, r]));
  const enrollmentIds = rows.map((r) => r.enrollmentId);
  const minD = classDays[0]!;
  const maxD = classDays[classDays.length - 1]!;

  const cells: TeacherAttendanceMatrixPayload["cells"] = {};
  for (const row of rows) {
    const rowCells: Record<string, SectionAttendanceStatusDb | null> = {};
    for (const d of classDays) {
      const ok =
        cellEligibility === "all" ||
        enrollmentEligibleForAttendanceOnDate(d, row.createdAt, row.enrollmentStatus, row.updatedAt, {
          sectionStartsOn,
        });
      if (ok) rowCells[d] = null;
    }
    cells[row.enrollmentId] = rowCells;
  }

  if (enrollmentIds.length) {
    const { data: att } = await supabase
      .from("section_attendance")
      .select("enrollment_id, attended_on, status")
      .in("enrollment_id", enrollmentIds)
      .gte("attended_on", minD)
      .lte("attended_on", maxD);

    for (const row of att ?? []) {
      const eid = row.enrollment_id as string;
      const day = String(row.attended_on).slice(0, 10);
      const meta = byEnrollmentId.get(eid);
      if (!meta || cells[eid]?.[day] === undefined) continue;
      if (
        cellEligibility !== "all" &&
        !enrollmentEligibleForAttendanceOnDate(
          day,
          meta.createdAt,
          meta.enrollmentStatus,
          meta.updatedAt,
          { sectionStartsOn },
        )
      ) {
        continue;
      }
      cells[eid][day] = row.status as SectionAttendanceStatusDb;
    }
  }

  const holidayLabels: Record<string, string> = {};
  const { data: hol } = await supabase
    .from("academic_no_class_days")
    .select("on_date, label")
    .gte("on_date", minD)
    .lte("on_date", maxD);
  for (const h of hol ?? []) {
    const k = String((h as { on_date: string }).on_date).slice(0, 10);
    holidayLabels[k] = String((h as { label?: string }).label ?? "").trim();
  }

  return { classDays, classDaysTruncated, rows, cells, holidayLabels };
}
