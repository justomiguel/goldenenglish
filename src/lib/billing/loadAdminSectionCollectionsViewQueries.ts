import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapSectionFeePlanRow,
  type SectionFeePlan,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";
import type { ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import type { StudentMonthlyPaymentRecord } from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import type { SectionScheduleSlot } from "@/types/academics";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import type { StudentPromotionStatusRow } from "@/lib/billing/studentPromotionStatus";

export interface SectionMeta {
  id: string;
  name: string;
  cohortId: string;
  cohortName: string;
  archivedAt: string | null;
  startsOn: string;
  endsOn: string;
  scheduleSlots: SectionScheduleSlot[];
  enrollmentFeeAmount: number;
}

export interface EnrollmentRow {
  student_id: string;
  created_at: string | null;
  enrollment_fee_exempt: boolean | null;
  enrollment_exempt_reason: string | null;
  scholarship_discount_percent: number | string | null;
  scholarship_valid_from_year: number | null;
  scholarship_valid_from_month: number | null;
  scholarship_valid_until_year: number | null;
  scholarship_valid_until_month: number | null;
  scholarship_is_active: boolean | null;
}

export type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  dni_or_passport: string | null;
  enrollment_fee_exempt: boolean | null;
  enrollment_exempt_reason: string | null;
};

export interface PaymentRow {
  id: string;
  student_id: string;
  section_id: string | null;
  month: number;
  year: number;
  amount: number | string | null;
  status: StudentMonthlyPaymentRecord["status"];
  receipt_url: string | null;
}

export type ScholarshipDbRow = {
  id: string;
  enrollment_id: string;
  student_id: string;
  discount_percent: number | string;
  note: string | null;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
};

export type StudentPromotionDbRow = StudentPromotionStatusRow & Record<string, unknown> & {
  student_id: string;
  applied_at: string | null;
};

export async function loadSectionMeta(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionMeta | null> {
  const { data } = await supabase
    .from("academic_sections")
    .select(
      "id, name, archived_at, cohort_id, starts_on, ends_on, schedule_slots, enrollment_fee_amount, academic_cohorts(id, name)",
    )
    .eq("id", sectionId)
    .maybeSingle();
  if (!data) return null;
  type Row = {
    id: string;
    name: string;
    archived_at: string | null;
    cohort_id: string;
    starts_on: string | null;
    ends_on: string | null;
    schedule_slots: unknown;
    enrollment_fee_amount: number | string | null;
    academic_cohorts:
      | { id: string; name: string }
      | { id: string; name: string }[]
      | null;
  };
  const row = data as Row;
  const cohort = Array.isArray(row.academic_cohorts)
    ? row.academic_cohorts[0]
    : row.academic_cohorts;
  const rawEnrollment =
    row.enrollment_fee_amount == null ? 0 : Number(row.enrollment_fee_amount);
  return {
    id: row.id,
    name: row.name,
    cohortId: row.cohort_id,
    cohortName: cohort?.name ?? "",
    archivedAt: row.archived_at ?? null,
    startsOn: row.starts_on ?? "",
    endsOn: row.ends_on ?? "",
    scheduleSlots: parseSectionScheduleSlots(row.schedule_slots ?? []),
    enrollmentFeeAmount:
      Number.isFinite(rawEnrollment) && rawEnrollment >= 0 ? rawEnrollment : 0,
  };
}

export async function loadActivePlans(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionFeePlan[]> {
  const { data } = await supabase
    .from("section_fee_plans")
    .select(
      "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
    )
    .is("archived_at", null)
    .eq("section_id", sectionId);
  return ((data ?? []) as SectionFeePlanRowDb[]).map(mapSectionFeePlanRow);
}

export async function loadActiveEnrollments(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<EnrollmentRow[]> {
  const { data } = await supabase
    .from("section_enrollments")
    .select(
      "student_id, created_at, enrollment_fee_exempt, enrollment_exempt_reason, scholarship_discount_percent, scholarship_valid_from_year, scholarship_valid_from_month, scholarship_valid_until_year, scholarship_valid_until_month, scholarship_is_active",
    )
    .eq("section_id", sectionId)
    .eq("status", "active");
  return ((data ?? []) as EnrollmentRow[]).map((row) => ({
    student_id: row.student_id,
    created_at: row.created_at ?? null,
    enrollment_fee_exempt: row.enrollment_fee_exempt ?? null,
    enrollment_exempt_reason: row.enrollment_exempt_reason ?? null,
    scholarship_discount_percent: row.scholarship_discount_percent ?? null,
    scholarship_valid_from_year: row.scholarship_valid_from_year ?? null,
    scholarship_valid_from_month: row.scholarship_valid_from_month ?? null,
    scholarship_valid_until_year: row.scholarship_valid_until_year ?? null,
    scholarship_valid_until_month: row.scholarship_valid_until_month ?? null,
    scholarship_is_active: row.scholarship_is_active ?? null,
  }));
}

export function studentDisplayName(p: ProfileRow): string {
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.id;
}

export function mapScholarship(
  row: ScholarshipDbRow,
): ScholarshipRow {
  return {
    id: row.id,
    discount_percent: Number(row.discount_percent),
    note: row.note,
    valid_from_year: row.valid_from_year,
    valid_from_month: row.valid_from_month,
    valid_until_year: row.valid_until_year,
    valid_until_month: row.valid_until_month,
    is_active: Boolean(row.is_active),
  };
}

export function mapEnrollmentScholarship(
  row: Pick<
    EnrollmentRow,
    | "scholarship_discount_percent"
    | "scholarship_valid_from_year"
    | "scholarship_valid_from_month"
    | "scholarship_valid_until_year"
    | "scholarship_valid_until_month"
    | "scholarship_is_active"
  >,
): ScholarshipRow | null {
  if (
    row.scholarship_discount_percent == null ||
    row.scholarship_valid_from_year == null ||
    row.scholarship_valid_from_month == null
  ) {
    return null;
  }
  return {
    discount_percent: Number(row.scholarship_discount_percent),
    valid_from_year: row.scholarship_valid_from_year,
    valid_from_month: row.scholarship_valid_from_month,
    valid_until_year: row.scholarship_valid_until_year,
    valid_until_month: row.scholarship_valid_until_month,
    is_active: Boolean(row.scholarship_is_active),
  };
}

