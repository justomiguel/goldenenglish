import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TeacherAttendancePreviewRow,
  TeacherRosterRow,
  TeacherTransferTargetOption,
} from "@/types/teacherPortal";
import { resolveAvatarDisplayUrl } from "@/lib/dashboard/resolveAvatarUrl";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";
import {
  compareProfileSnakeByLastThenFirst,
  formatProfileSnakeSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";

type CohortNameCell = { name: string } | { name: string }[] | null;

type SectionForTargets = {
  id: string;
  name: string;
  cohort_id: string;
  max_students: number | null;
  academic_cohorts: CohortNameCell;
};

function cohortNameFromJoin(raw: CohortNameCell): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

function effectiveMax(m: number | null | undefined, fallback: number) {
  return m == null || !Number.isFinite(m) || m < 1 ? fallback : m;
}

type AttendanceStatusKey = "present" | "absent" | "justified";

export async function loadTeacherSectionDetailModel(
  supabase: SupabaseClient,
  input: {
    locale: string;
    userId: string;
    sectionId: string;
    cohortId: string;
    attendanceStatusLabels: Record<AttendanceStatusKey, string>;
  },
): Promise<{
  rows: TeacherRosterRow[];
  sectionTargets: TeacherTransferTargetOption[];
  cohortTargets: TeacherTransferTargetOption[];
  pendingStudentIds: string[];
  attendanceByStudent: Record<string, TeacherAttendancePreviewRow[]>;
}> {
  const { locale, userId, sectionId, cohortId, attendanceStatusLabels } = input;
  const defaultMax = getDefaultSectionMaxStudents();

  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("id, status, student_id, profiles!student_id(first_name,last_name,avatar_url)")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });

  type ProfileJoin = { first_name: string; last_name: string; avatar_url: string | null };
  const rawList =
    (enrollments ?? []).map((raw) => {
      const r = raw as {
        id: string;
        status: string;
        student_id: string;
        profiles: ProfileJoin | ProfileJoin[] | null;
      };
      const pRaw = r.profiles;
      const p = Array.isArray(pRaw) ? (pRaw[0] ?? null) : pRaw;
      const label = p ? formatProfileSnakeSurnameFirst(p, r.student_id) : r.student_id;
      return {
        enrollmentId: r.id,
        studentId: r.student_id,
        label,
        status: r.status,
        avatarRaw: p?.avatar_url?.trim() ? p.avatar_url.trim() : null,
        _p: p,
      };
    }) ?? [];
  const rawRows = [...rawList]
    .sort((a, b) => {
      if (!a._p && !b._p) return 0;
      if (!a._p) return 1;
      if (!b._p) return -1;
      return compareProfileSnakeByLastThenFirst(a._p, b._p);
    })
    .map(({ _p, ...rest }) => rest);

  const uniqueAvatars = [...new Set(rawRows.map((x) => x.avatarRaw).filter((u): u is string => Boolean(u)))];
  const resolvedMap = new Map<string, string | null>();
  await Promise.all(
    uniqueAvatars.map(async (u) => {
      resolvedMap.set(u, await resolveAvatarDisplayUrl(supabase, u));
    }),
  );

  const rows: TeacherRosterRow[] = rawRows.map((r) => ({
    enrollmentId: r.enrollmentId,
    studentId: r.studentId,
    label: r.label,
    status: r.status,
    avatarDisplayUrl: r.avatarRaw ? (resolvedMap.get(r.avatarRaw) ?? null) : null,
  }));

  const { data: pendingRows } = await supabase
    .from("section_transfer_requests")
    .select("student_id")
    .eq("from_section_id", sectionId)
    .eq("status", "pending");

  const pendingStudentIds = [...new Set((pendingRows ?? []).map((p) => p.student_id as string))];

  const { data: cohortPeer } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, max_students, academic_cohorts(name)")
    .eq("cohort_id", cohortId);

  const mySectionIds = await loadTeacherSectionIdsForUser(supabase, userId);
  let myOtherCohort: SectionForTargets[] = [];
  if (mySectionIds.length > 0) {
    const { data: otherRows } = await supabase
      .from("academic_sections")
      .select("id, name, cohort_id, max_students, academic_cohorts(name)")
      .in("id", mySectionIds)
      .neq("cohort_id", cohortId);
    myOtherCohort = (otherRows ?? []) as SectionForTargets[];
  }

  const mergedMap = new Map<string, SectionForTargets>();
  for (const s of cohortPeer ?? []) {
    const row = s as SectionForTargets;
    mergedMap.set(row.id, row);
  }
  for (const s of myOtherCohort ?? []) {
    const row = s as SectionForTargets;
    mergedMap.set(row.id, row);
  }
  const merged = [...mergedMap.values()];

  const sectionIds = merged.map((s) => s.id as string);
  let countRows: { section_id: string }[] = [];
  if (sectionIds.length) {
    const { data } = await supabase
      .from("section_enrollments")
      .select("section_id")
      .in("section_id", sectionIds)
      .eq("status", "active");
    countRows = data ?? [];
  }

  const activeBySection = new Map<string, number>();
  for (const sid of sectionIds) activeBySection.set(sid, 0);
  for (const cr of countRows) {
    const sid = cr.section_id as string;
    activeBySection.set(sid, (activeBySection.get(sid) ?? 0) + 1);
  }

  function toTarget(sec: SectionForTargets): TeacherTransferTargetOption {
    const id = sec.id as string;
    const cn = cohortNameFromJoin(sec.academic_cohorts as CohortNameCell);
    const maxStudents = effectiveMax(sec.max_students as number | null, defaultMax);
    const activeCount = activeBySection.get(id) ?? 0;
    return {
      id,
      label: `${cn} — ${sec.name as string}`,
      activeCount,
      maxStudents,
      atCapacity: activeCount >= maxStudents,
    };
  }

  const sectionTargets = (cohortPeer ?? [])
    .filter((s) => (s.id as string) !== sectionId)
    .map(toTarget)
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  const cohortTargets = (myOtherCohort ?? []).map(toTarget).sort((a, b) => a.label.localeCompare(b.label, locale));

  const studentIds = rows.map((r) => r.studentId);
  const attendanceByStudent: Record<string, TeacherAttendancePreviewRow[]> = {};
  if (studentIds.length) {
    const { data: atts } = await supabase
      .from("attendance")
      .select("student_id, attendance_date, status")
      .in("student_id", studentIds)
      .order("attendance_date", { ascending: false })
      .limit(600);

    const df = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
    for (const sid of studentIds) attendanceByStudent[sid] = [];

    for (const a of atts ?? []) {
      const sid = a.student_id as string;
      const list = attendanceByStudent[sid];
      if (!list || list.length >= 14) continue;
      const key = a.status as AttendanceStatusKey;
      const statusLabel = attendanceStatusLabels[key] ?? String(a.status);
      list.push({
        date: df.format(new Date(a.attendance_date as string)),
        status: statusLabel,
      });
    }
  }

  return {
    rows,
    sectionTargets,
    cohortTargets,
    pendingStudentIds,
    attendanceByStudent,
  };
}
