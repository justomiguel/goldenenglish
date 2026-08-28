import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import type { SectionScheduleSlot } from "@/types/academics";
import {
  parseMonthlyFeeChargeMode,
  type MonthlyFeeChargeMode,
} from "@/lib/billing/monthlyFeeChargeMode";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";
import {
  parseOptionalFeeAmount,
  resolveEffectiveEnrollmentFeeAmount,
} from "@/lib/billing/resolveCohortFeeDefaults";

export type EnrollmentSectionRow = {
  id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  schedule_slots: unknown;
  enrollment_fee_amount: number | string | null;
  monthly_fee_charge_mode?: string | null;
  allow_advance_monthly_payment?: boolean | null;
  academic_cohorts:
    | {
        name: string;
        default_enrollment_fee_amount?: number | string | null;
        default_monthly_fee?: number | string | null;
      }
    | {
        name: string;
        default_enrollment_fee_amount?: number | string | null;
        default_monthly_fee?: number | string | null;
      }[]
    | null;
};

export type EnrollmentRow = {
  id: string;
  section_id: string;
  created_at: string | null;
  academic_sections: EnrollmentSectionRow | EnrollmentSectionRow[] | null;
  enrollment_fee_exempt?: boolean | null;
  enrollment_exempt_reason?: string | null;
  enrollment_fee_receipt_url?: string | null;
  enrollment_fee_receipt_status?: string | null;
  last_enrollment_paid_at?: string | null;
};

export type StudentMonthlySectionMeta = {
  enrollmentId: string;
  sectionId: string;
  sectionName: string;
  cohortName: string;
  startsOn: string;
  endsOn: string;
  monthlyFeeChargeMode: MonthlyFeeChargeMode;
  allowAdvanceMonthlyPayment: boolean;
  scheduleSlots: SectionScheduleSlot[];
  enrolledAt: string | null;
  enrollmentFeeAmount: number;
  enrollmentFeeExempt: boolean;
  enrollmentFeeExemptReason: string | null;
  enrollmentFeeReceiptUrl: string | null;
  enrollmentFeeReceiptStatus: "pending" | "approved" | "rejected" | null;
  enrollmentFeeReceiptSignedUrl: string | null;
  lastEnrollmentPaidAt: string | null;
  scholarships: ScholarshipRow[];
  cohortDefaultMonthlyFee: number | null;
};

export async function mapEnrollmentRowToSectionMeta(
  supabase: SupabaseClient,
  studentId: string,
  row: EnrollmentRow,
  scholarships: ScholarshipRow[],
): Promise<StudentMonthlySectionMeta> {
  const sec = Array.isArray(row.academic_sections)
    ? row.academic_sections[0]
    : row.academic_sections;
  const cohort = sec
    ? Array.isArray(sec.academic_cohorts)
      ? sec.academic_cohorts[0]
      : sec.academic_cohorts
    : null;
  const receiptUrl = row.enrollment_fee_receipt_url ?? null;
  const receiptSignedUrl = receiptUrl
    ? await studentReceiptSignedUrl(supabase, studentId, receiptUrl)
    : null;
  const rawStatus = row.enrollment_fee_receipt_status ?? null;
  const receiptStatus =
    rawStatus === "pending" || rawStatus === "approved" || rawStatus === "rejected"
      ? rawStatus
      : null;
  return {
    enrollmentId: row.id,
    sectionId: row.section_id,
    sectionName: sec?.name ?? "",
    cohortName: cohort?.name ?? "",
    startsOn: sec?.starts_on ?? "",
    endsOn: sec?.ends_on ?? "",
    monthlyFeeChargeMode: parseMonthlyFeeChargeMode(sec?.monthly_fee_charge_mode),
    allowAdvanceMonthlyPayment: sec?.allow_advance_monthly_payment === true,
    scheduleSlots: parseSectionScheduleSlots(sec?.schedule_slots ?? []),
    enrolledAt: row.created_at ?? null,
    enrollmentFeeAmount: resolveEffectiveEnrollmentFeeAmount(
      parseOptionalFeeAmount(sec?.enrollment_fee_amount),
      parseOptionalFeeAmount(cohort?.default_enrollment_fee_amount),
    ),
    cohortDefaultMonthlyFee: parseOptionalFeeAmount(cohort?.default_monthly_fee),
    enrollmentFeeExempt: Boolean(row.enrollment_fee_exempt),
    enrollmentFeeExemptReason: row.enrollment_exempt_reason ?? null,
    enrollmentFeeReceiptUrl: receiptUrl,
    enrollmentFeeReceiptStatus: receiptStatus,
    scholarships,
    enrollmentFeeReceiptSignedUrl: receiptSignedUrl,
    lastEnrollmentPaidAt: row.last_enrollment_paid_at ?? null,
  };
}
