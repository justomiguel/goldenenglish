import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StudentHubJourneyItem,
  StudentHubModel,
  StudentHubSectionRow,
  StudentHubTransferPing,
} from "@/types/studentHub";
import { formatAcademicScheduleSummary } from "@/lib/academics/formatAcademicScheduleSummary";
import { sectionAttendanceMonthPresentPct } from "@/lib/academics/sectionAttendanceMonthPct";
import { loadStudentPublishedGrades } from "@/lib/student/loadStudentPublishedGrades";

type CohortCell = { name: string } | { name: string }[] | null;

function cohortName(raw: CohortCell): string {
  if (!raw) return "";
  return Array.isArray(raw) ? (raw[0]?.name ?? "") : raw.name;
}

export async function loadStudentHubModel(
  supabase: SupabaseClient,
  userId: string,
  locale: string,
): Promise<StudentHubModel> {
  const { data: enr } = await supabase
    .from("section_enrollments")
    .select("id, status, created_at, section_id")
    .eq("student_id", userId)
    .order("created_at", { ascending: false });

  const sectionIds = [...new Set((enr ?? []).map((e) => e.section_id as string))];
  const sectionsMeta: Record<
    string,
    {
      name: string;
      cohort_id: string;
      schedule_slots: unknown;
      teacher_id: string;
      academic_cohorts: CohortCell;
    }
  > = {};

  if (sectionIds.length) {
    const { data: secs } = await supabase
      .from("academic_sections")
      .select("id, name, cohort_id, schedule_slots, teacher_id, academic_cohorts(name)")
      .in("id", sectionIds);
    for (const s of secs ?? []) {
      sectionsMeta[s.id as string] = {
        name: s.name as string,
        cohort_id: s.cohort_id as string,
        schedule_slots: s.schedule_slots,
        teacher_id: s.teacher_id as string,
        academic_cohorts: s.academic_cohorts as CohortCell,
      };
    }
  }

  const teacherIds = [...new Set(Object.values(sectionsMeta).map((s) => s.teacher_id))];
  const teacherName: Record<string, string> = {};
  if (teacherIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", teacherIds);
    for (const p of profs ?? []) {
      teacherName[p.id as string] =
        `${(p.first_name as string) ?? ""} ${(p.last_name as string) ?? ""}`.trim();
    }
  }

  const sections: StudentHubSectionRow[] = [];
  for (const row of enr ?? []) {
    const sid = row.section_id as string;
    const meta = sectionsMeta[sid];
    if (!meta) continue;
    sections.push({
      enrollmentId: row.id as string,
      status: row.status as string,
      sectionName: meta.name,
      cohortName: cohortName(meta.academic_cohorts),
      teacherDisplayName: teacherName[meta.teacher_id] ?? "",
      scheduleSlots: meta.schedule_slots,
      friendlySchedule: formatAcademicScheduleSummary(meta.schedule_slots, locale),
      createdAt: String(row.created_at ?? ""),
    });
  }

  const enrollmentIds = sections.map((s) => s.enrollmentId);
  const enrollmentToCohortId = new Map<string, string>();
  const enrollmentToSectionName = new Map<string, string>();
  for (const row of enr ?? []) {
    const sid = row.section_id as string;
    const meta = sectionsMeta[sid];
    if (!meta) continue;
    enrollmentToCohortId.set(row.id as string, meta.cohort_id);
    enrollmentToSectionName.set(row.id as string, meta.name);
  }

  const publishedGrades = await loadStudentPublishedGrades(
    supabase,
    enrollmentIds,
    enrollmentToCohortId,
    enrollmentToSectionName,
    locale,
  );

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  let attRows: { enrollment_id: string; attended_on: string; status: string }[] = [];
  if (enrollmentIds.length) {
    const { data: att } = await supabase
      .from("section_attendance")
      .select("enrollment_id, attended_on, status")
      .in("enrollment_id", enrollmentIds)
      .gte("attended_on", monthStart)
      .lte("attended_on", monthEnd);
    attRows = (att ?? []) as { enrollment_id: string; attended_on: string; status: string }[];
  }

  const pctByEnrollment = new Map<string, number | null>();
  for (const id of enrollmentIds) {
    const slice = attRows.filter((r) => r.enrollment_id === id);
    pctByEnrollment.set(
      id,
      sectionAttendanceMonthPresentPct(
        slice.map((r) => ({ attended_on: r.attended_on, status: r.status })),
        y,
        m,
      ),
    );
  }

  const journey: StudentHubJourneyItem[] = [...sections]
    .reverse()
    .map((s) => ({
      title: s.cohortName ? `${s.cohortName} — ${s.sectionName}` : s.sectionName,
      status: s.status,
      scheduleLine: s.friendlySchedule,
      variant: s.status === "active" ? "active" : "past",
      enrollmentId: s.enrollmentId,
      attendanceMonthPct: pctByEnrollment.get(s.enrollmentId) ?? null,
    }));

  const { data: trRows } = await supabase
    .from("section_transfer_requests")
    .select("reviewed_at")
    .eq("student_id", userId)
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(5);

  const approvedTransfers: StudentHubTransferPing[] = (trRows ?? [])
    .map((r) => ({ reviewedAt: r.reviewed_at ? String(r.reviewed_at) : "" }))
    .filter((r) => r.reviewedAt);

  const { data: pend } = await supabase
    .from("payments")
    .select("id")
    .eq("student_id", userId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  let billingPending = Boolean(pend);

  if (!billingPending) {
    const { count } = await supabase
      .from("billing_invoices")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .in("status", ["pending", "verifying", "overdue"]);
    billingPending = (count ?? 0) > 0;
  }

  return {
    sections,
    journey,
    approvedTransfers,
    billingPending,
    publishedGrades,
  };
}
