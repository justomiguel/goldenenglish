import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapSectionFeePlanRow,
  type SectionFeePlan,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";
import type {
  StudentMonthlyPaymentsView,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import { buildStudentMonthlyPaymentsRow } from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import { loadStudentYearSectionPaymentsMap } from "@/lib/billing/loadStudentYearSectionPaymentsMap";
import { type ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import { loadSectionBillingModes } from "@/lib/billing/loadSectionBillingModes";
import {
  mapEnrollmentRowToSectionMeta,
  type EnrollmentRow,
} from "@/lib/billing/loadStudentMonthlyPaymentsViewSupport";

interface LoadOptions {
  todayYear: number;
  todayMonth: number;
}

/**
 * Loads the data needed to render the student monthly payments strip:
 * one row per active section with its 12-month cells.
 */
export async function loadStudentMonthlyPaymentsView(
  supabase: SupabaseClient,
  studentId: string,
  scholarship: ScholarshipRow[] | null,
  opts: LoadOptions,
): Promise<StudentMonthlyPaymentsView> {
  const activeEnrollmentResult = await supabase
    .from("section_enrollments")
    .select(
      "id, section_id, created_at, enrollment_fee_exempt, enrollment_exempt_reason, enrollment_fee_receipt_url, enrollment_fee_receipt_status, last_enrollment_paid_at, academic_sections(id, name, starts_on, ends_on, schedule_slots, enrollment_fee_amount, monthly_fee_charge_mode, allow_advance_monthly_payment, academic_cohorts(name, default_enrollment_fee_amount, default_monthly_fee))",
    )
    .eq("student_id", studentId)
    .eq("status", "active");
  const fallbackEnrollmentResult =
    activeEnrollmentResult.error?.code === "42703"
      ? await supabase
          .from("section_enrollments")
          .select(
            "id, section_id, created_at, enrollment_fee_exempt, enrollment_exempt_reason, last_enrollment_paid_at, academic_sections(id, name, starts_on, ends_on, schedule_slots, enrollment_fee_amount, monthly_fee_charge_mode, allow_advance_monthly_payment, academic_cohorts(name, default_enrollment_fee_amount, default_monthly_fee))",
          )
          .eq("student_id", studentId)
          .eq("status", "active")
      : null;
  const enrollments = fallbackEnrollmentResult?.data ?? activeEnrollmentResult.data;

  const enrollmentRows = (enrollments ?? []) as EnrollmentRow[];
  const enrollmentIds = enrollmentRows.map((row) => row.id);
  type ScholarshipDbRow = {
    id: string;
    enrollment_id: string;
    discount_percent: number | string;
    note: string | null;
    valid_from_year: number;
    valid_from_month: number;
    valid_until_year: number | null;
    valid_until_month: number | null;
    is_active: boolean;
  };
  const { data: scholarshipRows } = enrollmentIds.length === 0
    ? { data: [] }
    : await supabase
        .from("section_enrollment_scholarships")
        .select(
          "id, enrollment_id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
        )
        .in("enrollment_id", enrollmentIds);
  const scholarshipsByEnrollment = new Map<string, ScholarshipRow[]>();
  for (const row of (scholarshipRows ?? []) as ScholarshipDbRow[]) {
    const list = scholarshipsByEnrollment.get(row.enrollment_id) ?? [];
    list.push({
      id: row.id,
      discount_percent: Number(row.discount_percent),
      note: row.note,
      valid_from_year: row.valid_from_year,
      valid_from_month: row.valid_from_month,
      valid_until_year: row.valid_until_year,
      valid_until_month: row.valid_until_month,
      is_active: Boolean(row.is_active),
    });
    scholarshipsByEnrollment.set(row.enrollment_id, list);
  }

  const sections = await Promise.all(
    enrollmentRows.map((row) =>
      mapEnrollmentRowToSectionMeta(
        supabase,
        studentId,
        row,
        scholarshipsByEnrollment.get(row.id) ?? [],
      ),
    ),
  );

  const sectionIds = [...new Set(sections.map((s) => s.sectionId))];
  const billingModeBySection = await loadSectionBillingModes(supabase, sectionIds);

  let plansBySection = new Map<string, SectionFeePlan[]>();
  if (sectionIds.length > 0) {
    const { data: planRows } = await supabase
      .from("section_fee_plans")
      .select(
        "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
      )
      .is("archived_at", null)
      .in("section_id", sectionIds);
    plansBySection = ((planRows ?? []) as SectionFeePlanRowDb[]).reduce(
      (acc, raw) => {
        const plan = mapSectionFeePlanRow(raw);
        const list = acc.get(plan.sectionId) ?? [];
        list.push(plan);
        acc.set(plan.sectionId, list);
        return acc;
      },
      new Map<string, SectionFeePlan[]>(),
    );
  }

  const paymentsBySection = await loadStudentYearSectionPaymentsMap(
    supabase,
    studentId,
    sectionIds,
    opts.todayYear,
  );

  const rows: StudentMonthlyPaymentSectionRow[] = sections.map((s) =>
    buildStudentMonthlyPaymentsRow({
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      cohortName: s.cohortName,
      plans: plansBySection.get(s.sectionId) ?? [],
      payments: paymentsBySection.get(s.sectionId) ?? [],
      scholarship: s.scholarships.length > 0 ? s.scholarships : scholarship ?? [],
      todayYear: opts.todayYear,
      todayMonth: opts.todayMonth,
      sectionStartsOn: s.startsOn,
      sectionEndsOn: s.endsOn,
      studentEnrolledAt: s.enrolledAt,
      scheduleSlots: s.scheduleSlots,
      sectionEnrollmentFeeAmount: s.enrollmentFeeExempt ? 0 : s.enrollmentFeeAmount,
      sectionEnrollmentFeeExempt: s.enrollmentFeeExempt,
      sectionEnrollmentFeeExemptReason: s.enrollmentFeeExemptReason,
      enrollmentId: s.enrollmentId,
      enrollmentFeeReceiptStatus: s.enrollmentFeeReceiptStatus,
      enrollmentFeeReceiptSignedUrl: s.enrollmentFeeReceiptSignedUrl,
      lastEnrollmentPaidAt: s.lastEnrollmentPaidAt,
      monthlyFeeChargeMode: s.monthlyFeeChargeMode,
      allowAdvanceMonthlyPayment: s.allowAdvanceMonthlyPayment,
      sectionBillingMode: billingModeBySection.get(s.sectionId) ?? null,
      cohortDefaultMonthlyFee: s.cohortDefaultMonthlyFee,
    }),
  );

  return {
    todayMonth: opts.todayMonth,
    todayYear: opts.todayYear,
    rows,
  };
}
