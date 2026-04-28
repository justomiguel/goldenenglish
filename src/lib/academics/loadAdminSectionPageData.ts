import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import type { SectionScheduleSlot } from "@/types/academics";
import { pgDateToInputValue } from "@/lib/academics/pgDateToInputValue";
import { buildAdminSectionMoveTargets } from "@/lib/academics/buildAdminSectionMoveTargets";
import { loadAdminSectionTeachersAndAssistants } from "@/lib/academics/loadAdminSectionTeachersAndAssistants";
import { loadParentPaymentPendingMap } from "@/lib/academics/parentPaymentPending";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { mapSectionFeePlanRow, type SectionFeePlan, type SectionFeePlanRowDb } from "@/types/sectionFeePlan";
import { attachSectionFeePlansUsage, type SectionFeePlanPaymentRef } from "@/lib/billing/computeSectionFeePlansUsage";
import {
  compareProfileSnakeByLastThenFirst,
  formatProfileSnakeSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";

export interface AdminSectionRosterRow {
  enrollmentId: string;
  studentId: string;
  label: string;
  status: string;
}

export interface AdminSectionPageData {
  section: {
    id: string;
    name: string;
    cohortId: string;
    teacherId: string;
    archivedAt: string | null;
    startsOn: string;
    endsOn: string;
    roomLabel: string | null;
    effectiveMaxStudents: number;
    siteDefaultMax: number;
    activeEnrollmentCount: number;
    /**
     * Monto de matrícula a nivel de sección (>=0). 0 = no cobra matrícula.
     * Moneda se reusa del plan vigente.
     */
    enrollmentFeeAmount: number;
  };
  cohort: {
    name: string;
    archivedAt: string | null;
    label: string;
  };
  slots: SectionScheduleSlot[];
  rows: AdminSectionRosterRow[];
  debtByStudentId: Record<string, boolean>;
  staff: Awaited<ReturnType<typeof loadAdminSectionTeachersAndAssistants>>;
  feePlans: SectionFeePlan[];
  feePlansWithUsage: ReturnType<typeof attachSectionFeePlansUsage>;
  moveTargets: { id: string; label: string }[];
}

export async function loadAdminSectionPageData(
  supabase: SupabaseClient,
  cohortId: string,
  sectionId: string,
): Promise<AdminSectionPageData | null> {
  const { data: sec, error: sErr } = await supabase
    .from("academic_sections")
    .select(
      "id, name, cohort_id, teacher_id, schedule_slots, max_students, archived_at, starts_on, ends_on, room_label, enrollment_fee_amount, academic_cohorts(name, archived_at)",
    )
    .eq("id", sectionId)
    .maybeSingle();

  if (sErr) {
    logSupabaseClientError("academicSectionPage:sectionSelect", sErr, { sectionId, cohortId });
    return null;
  }
  if (!sec || (sec.cohort_id as string) !== cohortId) return null;

  const secRow = sec as {
    id: string;
    name: string;
    cohort_id: string;
    teacher_id: string;
    schedule_slots: unknown;
    max_students?: number | null;
    room_label?: string | null;
    archived_at: string | null;
    starts_on: string;
    ends_on: string;
    enrollment_fee_amount?: number | string | null;
    academic_cohorts:
      | { name: string; archived_at?: string | null }
      | { name: string; archived_at?: string | null }[]
      | null;
  };
  const cohortRaw = secRow.academic_cohorts;
  const cohortSingle = Array.isArray(cohortRaw) ? (cohortRaw[0] ?? null) : cohortRaw;
  const cohortName = cohortSingle?.name ?? "";
  const cohortArchivedAt = cohortSingle?.archived_at ?? null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const sectionStartsOn = pgDateToInputValue((secRow as { starts_on?: unknown }).starts_on) || todayIso;
  const sectionEndsOn = pgDateToInputValue((secRow as { ends_on?: unknown }).ends_on) || sectionStartsOn;
  const slots = parseSectionScheduleSlots(secRow.schedule_slots);
  const siteDefaultMax = getDefaultSectionMaxStudents();
  const storedMax = secRow.max_students;
  const effectiveMaxStudents = storedMax != null && Number.isFinite(storedMax) ? Math.floor(storedMax) : siteDefaultMax;

  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("id, status, student_id, profiles!student_id(first_name,last_name)")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });

  const rawEnrollments = (enrollments ?? []) as {
    id: string;
    status: string;
    student_id: string;
    profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  }[];
  const sortedEnrollments = [...rawEnrollments].sort((a, b) => {
    const pa = (Array.isArray(a.profiles) ? a.profiles[0] : a.profiles) ?? null;
    const pb = (Array.isArray(b.profiles) ? b.profiles[0] : b.profiles) ?? null;
    if (!pa && !pb) return 0;
    if (!pa) return 1;
    if (!pb) return -1;
    return compareProfileSnakeByLastThenFirst(pa, pb);
  });
  const rows: AdminSectionRosterRow[] = sortedEnrollments.map((r) => {
    const pRaw = r.profiles;
    const p = Array.isArray(pRaw) ? (pRaw[0] ?? null) : pRaw;
    const label = p ? formatProfileSnakeSurnameFirst(p, r.student_id) : r.student_id;
    return { enrollmentId: r.id, studentId: r.student_id, label, status: r.status };
  });
  const activeEnrollmentCount = rows.filter((r) => r.status === "active").length;

  const studentIds = [...new Set(rows.map((r) => r.studentId))];
  const debtMap = await loadParentPaymentPendingMap(supabase, studentIds);
  const debtByStudentId = Object.fromEntries(debtMap);

  const staff = await loadAdminSectionTeachersAndAssistants(supabase, sectionId, secRow.teacher_id);

  const { data: feePlanRows } = await supabase
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
    )
    .eq("section_id", sectionId);
  const feePlans = ((feePlanRows ?? []) as SectionFeePlanRowDb[]).map(mapSectionFeePlanRow);

  const { data: feePlanPaymentRows } = await supabase
    .from("payments")
    .select("year, month")
    .eq("section_id", sectionId);
  const feePlanPayments: SectionFeePlanPaymentRef[] = (
    (feePlanPaymentRows ?? []) as Array<{ year: number; month: number }>
  ).map((p) => ({ year: Number(p.year), month: Number(p.month) }));
  const feePlansWithUsage = attachSectionFeePlansUsage(feePlans, feePlanPayments);

  const { data: allSections } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, archived_at, academic_cohorts(name, archived_at)")
    .neq("id", sectionId)
    .is("archived_at", null)
    .order("name")
    .limit(2000);
  const moveTargets = buildAdminSectionMoveTargets(allSections, sectionId);

  const rawEnrollmentFee =
    secRow.enrollment_fee_amount == null ? 0 : Number(secRow.enrollment_fee_amount);
  const enrollmentFeeAmount =
    Number.isFinite(rawEnrollmentFee) && rawEnrollmentFee >= 0 ? rawEnrollmentFee : 0;

  return {
    section: {
      id: secRow.id,
      name: secRow.name,
      cohortId: secRow.cohort_id,
      teacherId: secRow.teacher_id,
      archivedAt: secRow.archived_at,
      startsOn: sectionStartsOn,
      endsOn: sectionEndsOn,
      roomLabel: secRow.room_label ?? null,
      effectiveMaxStudents,
      siteDefaultMax,
      activeEnrollmentCount,
      enrollmentFeeAmount,
    },
    cohort: {
      name: cohortName,
      archivedAt: cohortArchivedAt,
      label: `${cohortName} — ${secRow.name}`,
    },
    slots,
    rows,
    debtByStudentId,
    staff,
    feePlans,
    feePlansWithUsage,
    moveTargets,
  };
}
