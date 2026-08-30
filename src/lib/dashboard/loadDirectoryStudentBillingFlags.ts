import type { SupabaseClient } from "@supabase/supabase-js";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { buildStudentMonthlyPaymentsRow } from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import type { StudentMonthlyPaymentRecord } from "@/lib/billing/studentMonthlyPaymentsRowModel";
import { loadSectionBillingModes } from "@/lib/billing/loadSectionBillingModes";
import { parseMonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";
import {
  parseOptionalFeeAmount,
  resolveEffectiveEnrollmentFeeAmount,
} from "@/lib/billing/resolveCohortFeeDefaults";
import type { ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import {
  directoryFlagsFromEnrollmentFacts,
  monthlyAppliesFromPaymentCells,
  type DirectoryStudentBillingFlags,
} from "@/lib/dashboard/directoryBillingStatus";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { studentMonthlyPaymentsViewHasOverdueBalance } from "@/lib/parent/parentPaymentOverdueSignals";
import {
  mapSectionFeePlanRow,
  type SectionFeePlan,
  type SectionFeePlanRowDb,
} from "@/types/sectionFeePlan";
import type { EnrollmentRow } from "@/lib/billing/loadStudentMonthlyPaymentsViewSupport";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

type FlagEnrollmentRow = EnrollmentRow & { student_id: string };

type ScholarshipDbRow = {
  enrollment_id: string;
  discount_percent: number | string;
  note: string | null;
  valid_from_year: number;
  valid_from_month: number;
  valid_until_year: number | null;
  valid_until_month: number | null;
  is_active: boolean;
};

type PaymentDbRow = {
  id: string;
  student_id: string;
  section_id: string | null;
  month: number;
  year: number;
  amount: number | string | null;
  status: StudentMonthlyPaymentRecord["status"];
};

const ENROLLMENT_SELECT =
  "id, student_id, section_id, created_at, enrollment_fee_exempt, enrollment_fee_receipt_status, last_enrollment_paid_at, academic_sections(id, name, starts_on, ends_on, schedule_slots, enrollment_fee_amount, monthly_fee_charge_mode, allow_advance_monthly_payment, academic_cohorts(name, default_enrollment_fee_amount, default_monthly_fee))";

function enrollmentFeeAmount(row: FlagEnrollmentRow): number {
  const raw = row.academic_sections;
  const sec = Array.isArray(raw) ? raw[0] : raw;
  const cohort = sec
    ? Array.isArray(sec.academic_cohorts)
      ? sec.academic_cohorts[0]
      : sec.academic_cohorts
    : null;
  return resolveEffectiveEnrollmentFeeAmount(
    parseOptionalFeeAmount(sec?.enrollment_fee_amount),
    parseOptionalFeeAmount(cohort?.default_enrollment_fee_amount),
  );
}

function monthlySignalForStudent(
  studentId: string,
  enrollments: FlagEnrollmentRow[],
  plansBySection: Map<string, SectionFeePlan[]>,
  payments: PaymentDbRow[],
  scholarshipsByEnrollment: Map<string, ScholarshipRow[]>,
  billingModes: Map<string, string | null>,
  todayYear: number,
  todayMonth: number,
): { applies: boolean; overdue: boolean } {
  try {
    const rows = enrollments.map((row) => {
      const raw = row.academic_sections;
      const sec = Array.isArray(raw) ? raw[0] : raw;
      const cohort = sec
        ? Array.isArray(sec.academic_cohorts)
          ? sec.academic_cohorts[0]
          : sec.academic_cohorts
        : null;
      const sectionPayments = payments
        .filter((p) => p.student_id === studentId && p.section_id === row.section_id)
        .map((p) => ({
          id: p.id,
          sectionId: p.section_id,
          month: Number(p.month),
          year: Number(p.year),
          amount: p.amount == null ? null : Number(p.amount),
          status: p.status,
          receiptSignedUrl: null,
        }));
      return buildStudentMonthlyPaymentsRow({
        sectionId: row.section_id,
        sectionName: sec?.name ?? "",
        cohortName: cohort?.name ?? "",
        plans: plansBySection.get(row.section_id) ?? [],
        payments: sectionPayments,
        scholarship: scholarshipsByEnrollment.get(row.id) ?? [],
        todayYear,
        todayMonth,
        sectionStartsOn: sec?.starts_on ?? "",
        sectionEndsOn: sec?.ends_on ?? "",
        studentEnrolledAt: row.created_at ?? null,
        scheduleSlots: parseSectionScheduleSlots(sec?.schedule_slots ?? []),
        sectionEnrollmentFeeAmount: enrollmentFeeAmount(row),
        sectionEnrollmentFeeExempt: Boolean(row.enrollment_fee_exempt),
        monthlyFeeChargeMode: parseMonthlyFeeChargeMode(sec?.monthly_fee_charge_mode),
        allowAdvanceMonthlyPayment: sec?.allow_advance_monthly_payment === true,
        sectionBillingMode: billingModes.get(row.section_id) ?? null,
        cohortDefaultMonthlyFee: parseOptionalFeeAmount(cohort?.default_monthly_fee),
      });
    });
    const view: StudentMonthlyPaymentsView = { todayYear, todayMonth, rows };
    return {
      applies: monthlyAppliesFromPaymentCells(rows.flatMap((row) => row.cells)),
      overdue: studentMonthlyPaymentsViewHasOverdueBalance(view),
    };
  } catch {
    return { applies: false, overdue: false };
  }
}

export async function loadDirectoryStudentBillingFlags(
  admin: SupabaseClient,
  studentIds: string[],
  refDate = new Date(),
): Promise<Map<string, DirectoryStudentBillingFlags>> {
  const ids = studentIds.filter((id) => id.trim().length > 0);
  if (ids.length === 0) return new Map();

  const todayYear = refDate.getFullYear();
  const todayMonth = refDate.getMonth() + 1;
  const [enrollResult, scholarshipResult, paymentResult] = await Promise.all([
    admin.from("section_enrollments").select(ENROLLMENT_SELECT).in("student_id", ids).eq("status", "active"),
    admin
      .from("section_enrollment_scholarships")
      .select(
        "enrollment_id, discount_percent, note, valid_from_year, valid_from_month, valid_until_year, valid_until_month, is_active",
      )
      .in("student_id", ids)
      .eq("is_active", true),
    admin
      .from("payments")
      .select("id, student_id, section_id, month, year, amount, status")
      .in("student_id", ids)
      .eq("year", todayYear),
  ]);
  if (enrollResult.error) {
    logSupabaseClientError("loadDirectoryStudentBillingFlags:section_enrollments", enrollResult.error, {
      studentCount: ids.length,
    });
  }

  const enrollments = (enrollResult.data ?? []) as FlagEnrollmentRow[];
  const sectionIds = [...new Set(enrollments.map((row) => row.section_id))];
  const [billingModes, planResult] = await Promise.all([
    loadSectionBillingModes(admin, sectionIds),
    sectionIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : admin
          .from("section_fee_plans")
          .select(
            "id, section_id, effective_from_year, effective_from_month, monthly_fee, currency, archived_at",
          )
          .in("section_id", sectionIds)
          .is("archived_at", null),
  ]);

  const plansBySection = new Map<string, SectionFeePlan[]>();
  for (const raw of (planResult.data ?? []) as SectionFeePlanRowDb[]) {
    const plan = mapSectionFeePlanRow(raw);
    const list = plansBySection.get(plan.sectionId) ?? [];
    list.push(plan);
    plansBySection.set(plan.sectionId, list);
  }

  const scholarshipsByEnrollment = new Map<string, ScholarshipRow[]>();
  for (const raw of (scholarshipResult.data ?? []) as ScholarshipDbRow[]) {
    const list = scholarshipsByEnrollment.get(raw.enrollment_id) ?? [];
    list.push({
      id: raw.enrollment_id,
      discount_percent: Number(raw.discount_percent),
      note: raw.note,
      valid_from_year: raw.valid_from_year,
      valid_from_month: raw.valid_from_month,
      valid_until_year: raw.valid_until_year,
      valid_until_month: raw.valid_until_month,
      is_active: Boolean(raw.is_active),
    });
    scholarshipsByEnrollment.set(raw.enrollment_id, list);
  }

  const payments = (paymentResult.data ?? []) as PaymentDbRow[];
  const enrollmentsByStudent = new Map<string, FlagEnrollmentRow[]>();
  for (const row of enrollments) {
    const list = enrollmentsByStudent.get(row.student_id) ?? [];
    list.push(row);
    enrollmentsByStudent.set(row.student_id, list);
  }

  const monthlyByStudent = new Map<string, { applies: boolean; overdue: boolean }>();
  for (const id of ids) {
    monthlyByStudent.set(
      id,
      monthlySignalForStudent(
        id,
        enrollmentsByStudent.get(id) ?? [],
        plansBySection,
        payments,
        scholarshipsByEnrollment,
        billingModes,
        todayYear,
        todayMonth,
      ),
    );
  }

  return directoryFlagsFromEnrollmentFacts({
    studentIds: ids,
    enrollments: enrollments.map((row) => ({
      studentId: row.student_id,
      createdAt: row.created_at,
      amount: enrollmentFeeAmount(row),
      exempt: Boolean(row.enrollment_fee_exempt),
      lastEnrollmentPaidAt: row.last_enrollment_paid_at ?? null,
      receiptStatus: row.enrollment_fee_receipt_status ?? null,
    })),
    monthlyByStudent,
  });
}
