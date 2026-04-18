import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildSectionCollectionsView,
  type SectionCollectionsStudentInput,
} from "@/lib/billing/buildSectionCollectionsView";
import {
  mapSectionFeePlanRow,
  type SectionFeePlan,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";
import type { ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import type { StudentMonthlyPaymentRecord } from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import { chunkedIn } from "@/lib/supabase/chunkedIn";

export interface LoadAdminSectionCollectionsOptions {
  todayYear: number;
  todayMonth: number;
}

interface SectionMeta {
  id: string;
  name: string;
  cohortId: string;
  cohortName: string;
  archivedAt: string | null;
}

interface EnrollmentRow {
  student_id: string;
}

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  document_number: string | null;
};

interface PaymentRow {
  id: string;
  student_id: string;
  section_id: string | null;
  month: number;
  year: number;
  amount: number | string | null;
  status: StudentMonthlyPaymentRecord["status"];
  receipt_url: string | null;
}

type ScholarshipDbRow = {
  student_id: string;
  discount_percent: number | string;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
};

async function loadSectionMeta(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionMeta | null> {
  const { data } = await supabase
    .from("academic_sections")
    .select(
      "id, name, archived_at, cohort_id, academic_cohorts(id, name)",
    )
    .eq("id", sectionId)
    .maybeSingle();
  if (!data) return null;
  type Row = {
    id: string;
    name: string;
    archived_at: string | null;
    cohort_id: string;
    academic_cohorts:
      | { id: string; name: string }
      | { id: string; name: string }[]
      | null;
  };
  const row = data as Row;
  const cohort = Array.isArray(row.academic_cohorts)
    ? row.academic_cohorts[0]
    : row.academic_cohorts;
  return {
    id: row.id,
    name: row.name,
    cohortId: row.cohort_id,
    cohortName: cohort?.name ?? "",
    archivedAt: row.archived_at ?? null,
  };
}

async function loadActivePlans(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionFeePlan[]> {
  const { data } = await supabase
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, payments_count, charges_enrollment_fee, period_start_year, period_start_month, archived_at",
    )
    .is("archived_at", null)
    .eq("section_id", sectionId);
  return ((data ?? []) as SectionFeePlanRowDb[]).map(mapSectionFeePlanRow);
}

async function loadActiveEnrollmentStudentIds(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("section_enrollments")
    .select("student_id")
    .eq("section_id", sectionId)
    .eq("status", "active");
  return ((data ?? []) as EnrollmentRow[]).map((row) => row.student_id);
}

function studentDisplayName(p: ProfileRow): string {
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id;
}

function mapScholarship(row: ScholarshipDbRow | undefined): ScholarshipRow | null {
  if (!row) return null;
  return {
    discount_percent: Number(row.discount_percent),
    valid_from_year: row.valid_from_year,
    valid_from_month: row.valid_from_month,
    valid_until_year: row.valid_until_year,
    valid_until_month: row.valid_until_month,
    is_active: Boolean(row.is_active),
  };
}

/**
 * Bounded loader: only reads rows for one section + one calendar year. The
 * number of rows scales with the number of active students in that section
 * (decenas por sección por diseño de negocio).
 */
export async function loadAdminSectionCollectionsView(
  supabase: SupabaseClient,
  sectionId: string,
  opts: LoadAdminSectionCollectionsOptions,
): Promise<SectionCollectionsView | null> {
  const meta = await loadSectionMeta(supabase, sectionId);
  if (!meta) return null;

  const [studentIds, plans] = await Promise.all([
    loadActiveEnrollmentStudentIds(supabase, sectionId),
    loadActivePlans(supabase, sectionId),
  ]);

  if (studentIds.length === 0) {
    return buildSectionCollectionsView({
      sectionId: meta.id,
      sectionName: meta.name,
      cohortId: meta.cohortId,
      cohortName: meta.cohortName,
      todayYear: opts.todayYear,
      todayMonth: opts.todayMonth,
      plans,
      students: [],
    });
  }

  const [profiles, paymentsRes, scholarships] = await Promise.all([
    chunkedIn<ProfileRow>(
      supabase,
      "profiles",
      "id",
      studentIds,
      "id, first_name, last_name, document_number",
    ),
    supabase
      .from("payments")
      .select("id, student_id, section_id, month, year, amount, status, receipt_url")
      .eq("section_id", sectionId)
      .eq("year", opts.todayYear)
      .in("student_id", studentIds),
    chunkedIn<ScholarshipDbRow>(
      supabase,
      "student_scholarships",
      "student_id",
      studentIds,
      "student_id, discount_percent, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
    ),
  ]);

  const paymentsByStudent = new Map<string, StudentMonthlyPaymentRecord[]>();
  for (const raw of (paymentsRes.data ?? []) as PaymentRow[]) {
    const list = paymentsByStudent.get(raw.student_id) ?? [];
    list.push({
      id: raw.id,
      sectionId: raw.section_id,
      month: Number(raw.month),
      year: Number(raw.year),
      amount: raw.amount == null ? null : Number(raw.amount),
      status: raw.status,
      receiptSignedUrl: null, // admin overview does not need signed URLs
    });
    paymentsByStudent.set(raw.student_id, list);
  }

  const scholarshipByStudent = new Map<string, ScholarshipDbRow>();
  for (const row of scholarships) {
    scholarshipByStudent.set(row.student_id, row);
  }

  const profileById = new Map<string, ProfileRow>();
  for (const p of profiles) profileById.set(p.id, p);

  const students: SectionCollectionsStudentInput[] = studentIds.map((id) => {
    const profile = profileById.get(id) ?? {
      id,
      first_name: null,
      last_name: null,
      document_number: null,
    };
    return {
      studentId: id,
      studentName: studentDisplayName(profile),
      documentLabel: profile.document_number,
      scholarship: mapScholarship(scholarshipByStudent.get(id)),
      payments: paymentsByStudent.get(id) ?? [],
    };
  });

  return buildSectionCollectionsView({
    sectionId: meta.id,
    sectionName: meta.name,
    cohortId: meta.cohortId,
    cohortName: meta.cohortName,
    todayYear: opts.todayYear,
    todayMonth: opts.todayMonth,
    plans,
    students,
  });
}

export type { SectionMeta as LoadedSectionMeta };
