import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParentHubAttendanceLine } from "@/types/parentHub";
import { sectionAttendanceMonthPresentPct } from "@/lib/academics/sectionAttendanceMonthPct";
import {
  buildParentAttendanceSectionSummaries,
  worstParentAttendanceLevelFromSummaries,
} from "@/lib/parent/buildParentAttendanceSectionSummaries";
import type { ParentPillarLevel } from "@/lib/parent/buildParentHomePillarSnapshot";

type EnrollmentRow = {
  id: string;
  student_id: string;
  status: string;
  section_id: string;
};

export async function buildParentHubAttendanceSnapshot(
  supabase: SupabaseClient,
  studentIds: string[],
  enrollments: EnrollmentRow[],
  nameBy: Map<string, string>,
  sectionsMeta: Record<string, { name: string }>,
  globalMin: number,
  sectionMinOverrideBySectionId: Map<string, number | null>,
): Promise<{
  attendanceLines: ParentHubAttendanceLine[];
  attendanceLevelByStudent: Record<string, ParentPillarLevel>;
}> {
  const activeEnrollmentIds = enrollments
    .filter((row) => row.status === "active")
    .map((row) => row.id);
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth() + 1;
  const monthStart = `${y}-${String(mo).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);

  let attRows: { enrollment_id: string; attended_on: string; status: string }[] = [];
  if (activeEnrollmentIds.length) {
    const { data: att } = await supabase
      .from("section_attendance")
      .select("enrollment_id, attended_on, status")
      .in("enrollment_id", activeEnrollmentIds)
      .gte("attended_on", monthStart)
      .lte("attended_on", monthEnd);
    attRows = (att ?? []) as { enrollment_id: string; attended_on: string; status: string }[];
  }

  const attendanceLines: ParentHubAttendanceLine[] = [];
  for (const sid of studentIds) {
    const enrIdsForChild = enrollments
      .filter((row) => row.student_id === sid && row.status === "active")
      .map((row) => row.id);
    if (!enrIdsForChild.length) continue;
    const slice = attRows.filter((r) => enrIdsForChild.includes(r.enrollment_id));
    const pct = sectionAttendanceMonthPresentPct(
      slice.map((r) => ({ attended_on: r.attended_on, status: r.status })),
      y,
      mo,
    );
    if (pct == null) continue;
    const childFirstName = (nameBy.get(sid) ?? "").split(/\s+/)[0] ?? "";
    attendanceLines.push({ studentId: sid, childFirstName, pct });
  }

  const enrollmentMeta = new Map<
    string,
    { studentId: string; studentName: string; sectionId: string; sectionName: string }
  >();
  const rowsByEnrollment = new Map<string, { attended_on: string; status: string }[]>();
  for (const row of enrollments) {
    if (row.status !== "active") continue;
    const enrollmentId = row.id;
    const sectionId = row.section_id;
    const studentId = row.student_id;
    const sec = sectionsMeta[sectionId];
    enrollmentMeta.set(enrollmentId, {
      studentId,
      studentName: nameBy.get(studentId) ?? "",
      sectionId,
      sectionName: sec?.name ?? "",
    });
    const slice = attRows.filter((r) => r.enrollment_id === enrollmentId);
    rowsByEnrollment.set(
      enrollmentId,
      slice.map((r) => ({ attended_on: r.attended_on, status: r.status })),
    );
  }

  const sectionSummaries = buildParentAttendanceSectionSummaries(
    enrollmentMeta,
    rowsByEnrollment,
    y,
    mo,
    globalMin,
    sectionMinOverrideBySectionId,
  );

  const attendanceLevelByStudent: Record<string, ParentPillarLevel> = {};
  for (const sid of studentIds) {
    attendanceLevelByStudent[sid] = worstParentAttendanceLevelFromSummaries(sectionSummaries, sid);
  }

  return { attendanceLines, attendanceLevelByStudent };
}
