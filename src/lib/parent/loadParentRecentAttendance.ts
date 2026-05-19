import type { SupabaseClient } from "@supabase/supabase-js";
import type { AttendanceRow } from "@/lib/attendance/stats";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  buildParentAttendanceSectionSummaries,
  type ParentAttendanceSectionSummary,
} from "@/lib/parent/buildParentAttendanceSectionSummaries";
import { loadAcademicsSectionDefaults } from "@/lib/academics/loadAcademicsSectionDefaults";
import { loadSectionMinAttendanceOverrides } from "@/lib/academics/loadSectionMinAttendanceOverrides";

export type ParentAttendanceMark = {
  markId: string;
  attendedOn: string;
  status: AttendanceRow["status"];
  studentId: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
};

export type ParentAttendanceChildOption = {
  studentId: string;
  studentName: string;
};

export type ParentRecentAttendanceModel = {
  children: ParentAttendanceChildOption[];
  marks: ParentAttendanceMark[];
  sectionSummaries: ParentAttendanceSectionSummary[];
  requiredMinPercent: number;
};

const RECENT_MARK_LIMIT = 120;

type EnrollmentRow = {
  id: string;
  student_id: string;
  section_id: string;
  academic_sections: { id: string; name: string } | { id: string; name: string }[] | null;
};

function sectionNameFromEnrollment(row: EnrollmentRow): string {
  const raw = row.academic_sections;
  if (!raw) return "";
  const sec = Array.isArray(raw) ? raw[0] : raw;
  return sec?.name?.trim() ?? "";
}

async function loadMonthAttendanceByEnrollment(
  supabase: SupabaseClient,
  enrollmentIds: string[],
  monthStart: string,
  monthEnd: string,
): Promise<Map<string, { attended_on: string; status: string }[]>> {
  const byEnrollment = new Map<string, { attended_on: string; status: string }[]>();
  if (enrollmentIds.length === 0) return byEnrollment;

  const unique = [...new Set(enrollmentIds)];
  const chunkSize = 200;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const batch = unique.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("section_attendance")
      .select("enrollment_id, attended_on, status")
      .in("enrollment_id", batch)
      .gte("attended_on", monthStart)
      .lte("attended_on", monthEnd);
    if (error) {
      logSupabaseClientError("loadParentRecentAttendance:monthAttendance", error, {
        chunkSize: batch.length,
      });
      continue;
    }
    for (const row of data ?? []) {
      const id = row.enrollment_id as string;
      const list = byEnrollment.get(id) ?? [];
      list.push({
        attended_on: String(row.attended_on),
        status: String(row.status),
      });
      byEnrollment.set(id, list);
    }
  }
  return byEnrollment;
}

export async function loadParentRecentAttendance(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<ParentRecentAttendanceModel> {
  const { minAttendancePercent: globalMin } = await loadAcademicsSectionDefaults();

  const empty = (): ParentRecentAttendanceModel => ({
    children: [],
    marks: [],
    sectionSummaries: [],
    requiredMinPercent: globalMin,
  });
  const { data: links, error: linkErr } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", tutorId);

  if (linkErr) {
    logSupabaseClientError("loadParentRecentAttendance:tutor_student_rel", linkErr, {
      tutorId,
    });
    return empty();
  }

  const studentIds = (links ?? []).map((l) => l.student_id as string);
  if (studentIds.length === 0) {
    return empty();
  }

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", studentIds);

  if (profErr) {
    logSupabaseClientError("loadParentRecentAttendance:profiles", profErr, { tutorId });
    return empty();
  }

  const nameByStudent = new Map<string, string>();
  const children: ParentAttendanceChildOption[] = [];
  for (const p of profiles ?? []) {
    const sid = p.id as string;
    const studentName = formatProfileNameSurnameFirst(
      p.first_name as string | null,
      p.last_name as string | null,
    );
    nameByStudent.set(sid, studentName);
    children.push({ studentId: sid, studentName });
  }
  children.sort((a, b) => a.studentName.localeCompare(b.studentName, undefined, { sensitivity: "base" }));

  const { data: enrollments, error: enrErr } = await supabase
    .from("section_enrollments")
    .select("id, student_id, section_id, academic_sections(id, name)")
    .in("student_id", studentIds)
    .eq("status", "active");

  if (enrErr) {
    logSupabaseClientError("loadParentRecentAttendance:enrollments", enrErr, { tutorId });
    return { ...empty(), children };
  }

  const sectionIds = [
    ...new Set((enrollments ?? []).map((row) => (row as EnrollmentRow).section_id)),
  ];
  const sectionMinOverrideBySectionId = await loadSectionMinAttendanceOverrides(
    supabase,
    sectionIds,
  );

  const enrollmentMeta = new Map<
    string,
    { studentId: string; sectionId: string; sectionName: string }
  >();
  for (const row of (enrollments ?? []) as EnrollmentRow[]) {
    enrollmentMeta.set(row.id, {
      studentId: row.student_id,
      sectionId: row.section_id,
      sectionName: sectionNameFromEnrollment(row),
    });
  }

  const enrollmentIds = [...enrollmentMeta.keys()];
  if (enrollmentIds.length === 0) {
    return { ...empty(), children };
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  const monthRowsByEnrollment = await loadMonthAttendanceByEnrollment(
    supabase,
    enrollmentIds,
    monthStart,
    monthEnd,
  );

  const summaryMeta = new Map<
    string,
    { studentId: string; studentName: string; sectionId: string; sectionName: string }
  >();
  for (const [enrollmentId, meta] of enrollmentMeta) {
    summaryMeta.set(enrollmentId, {
      studentId: meta.studentId,
      studentName: nameByStudent.get(meta.studentId) ?? "",
      sectionId: meta.sectionId,
      sectionName: meta.sectionName,
    });
  }

  const sectionSummaries = buildParentAttendanceSectionSummaries(
    summaryMeta,
    monthRowsByEnrollment,
    year,
    month,
    globalMin,
    sectionMinOverrideBySectionId,
  );

  const attRowsRaw = await chunkedIn<{
    id: string;
    enrollment_id: string;
    attended_on: string;
    status: string;
  }>(
    supabase,
    "section_attendance",
    "enrollment_id",
    enrollmentIds,
    "id, enrollment_id, attended_on, status",
  );

  const sorted = [...attRowsRaw].sort((a, b) =>
    String(b.attended_on).localeCompare(String(a.attended_on)),
  );
  const capped = sorted.slice(0, RECENT_MARK_LIMIT);

  const marks: ParentAttendanceMark[] = [];
  for (const row of capped) {
    const meta = enrollmentMeta.get(row.enrollment_id);
    if (!meta) continue;
    const studentName = nameByStudent.get(meta.studentId) ?? "";
    marks.push({
      markId: row.id,
      attendedOn: String(row.attended_on).slice(0, 10),
      status: row.status as AttendanceRow["status"],
      studentId: meta.studentId,
      studentName,
      sectionId: meta.sectionId,
      sectionName: meta.sectionName,
    });
  }

  return { children, marks, sectionSummaries, requiredMinPercent: globalMin };
}
