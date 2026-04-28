import {
  buildStudentMonthlyPaymentsRow,
  type StudentMonthlyPaymentRecord,
} from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import {
  effectiveScholarshipPercentForPeriod,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import { enrollmentFeeIsOverduePrimitives } from "@/lib/billing/enrollmentFeeDue";
import {
  aggregateCells,
  buildSectionCollectionsKpis,
  round2,
} from "@/lib/billing/sectionCollectionsAggregates";
import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { SectionScheduleSlot } from "@/types/academics";
import type {
  EnrollmentFeeReceiptStatus,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import {
  type CohortCollectionsSectionSummary,
  type SectionCollectionsStudentRow,
  type SectionCollectionsView,
} from "@/types/sectionCollections";

export interface SectionCollectionsStudentInput {
  studentId: string;
  studentName: string;
  documentLabel: string | null;
  scholarships: ScholarshipRow[];
  enrollmentFeeExempt?: boolean;
  enrollmentExemptReason?: string | null;
  activePromotionLabel?: string | null;
  payments: StudentMonthlyPaymentRecord[];
  /** ISO timestamp/date — fecha de enrolment del alumno a esta sección. */
  enrolledAt: string | null;
  enrollmentId?: string | null;
  enrollmentFeeReceiptStatus?: EnrollmentFeeReceiptStatus | null;
  enrollmentFeeReceiptSignedUrl?: string | null;
}

export interface BuildSectionCollectionsViewInput {
  sectionId: string;
  sectionName: string;
  cohortId: string;
  cohortName: string;
  todayYear: number;
  todayMonth: number;
  plans: SectionFeePlan[];
  students: SectionCollectionsStudentInput[];
  /** ISO date (YYYY-MM-DD). Inicio operativo de la sección. */
  sectionStartsOn: string;
  /** ISO date (YYYY-MM-DD). Fin operativo de la sección. */
  sectionEndsOn: string;
  scheduleSlots: readonly SectionScheduleSlot[];
  /** Monto de matrícula a nivel de sección (>=0). 0 = no cobra matrícula. */
  sectionEnrollmentFeeAmount: number;
}

function enrollmentFeeAmount(input: BuildSectionCollectionsViewInput): number {
  const raw = Number(input.sectionEnrollmentFeeAmount);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function enrollmentFeeIsOverdue(
  input: BuildSectionCollectionsViewInput,
  enrolledAt: string | null,
): boolean {
  return enrollmentFeeIsOverduePrimitives(
    input.sectionStartsOn,
    enrolledAt,
    input.todayYear,
    input.todayMonth,
  );
}

function activeScholarshipDiscountPercent(
  scholarships: ScholarshipRow[],
  year: number,
  month: number,
): number | null {
  const pct = effectiveScholarshipPercentForPeriod(scholarships, year, month);
  return pct > 0 ? pct : null;
}

/**
 * Pure: build the admin section collections view by reusing the per-student
 * row builder, then aggregating per student and per section.
 */
export function buildSectionCollectionsView(
  input: BuildSectionCollectionsViewInput,
): SectionCollectionsView {
  const enrollmentFee = enrollmentFeeAmount(input);
  const studentRows: SectionCollectionsStudentRow[] = input.students.map((s) => {
    const studentEnrollmentFee = s.enrollmentFeeExempt ? 0 : enrollmentFee;
    const row: StudentMonthlyPaymentSectionRow = buildStudentMonthlyPaymentsRow({
      sectionId: input.sectionId,
      sectionName: input.sectionName,
      cohortName: input.cohortName,
      plans: input.plans,
      payments: s.payments,
      scholarship: s.scholarships,
      todayYear: input.todayYear,
      todayMonth: input.todayMonth,
      sectionStartsOn: input.sectionStartsOn,
      sectionEndsOn: input.sectionEndsOn,
      studentEnrolledAt: s.enrolledAt,
      scheduleSlots: input.scheduleSlots,
      sectionEnrollmentFeeAmount: studentEnrollmentFee,
      sectionEnrollmentFeeExempt: Boolean(s.enrollmentFeeExempt),
      sectionEnrollmentFeeExemptReason: s.enrollmentExemptReason ?? null,
      enrollmentId: s.enrollmentId ?? null,
      enrollmentFeeReceiptStatus: s.enrollmentFeeReceiptStatus ?? null,
      enrollmentFeeReceiptSignedUrl: s.enrollmentFeeReceiptSignedUrl ?? null,
      billingScope: "plan-year",
    });
    const agg = aggregateCells(row.cells, input.todayYear, input.todayMonth);
    const isEnrollmentFeeOverdue =
      studentEnrollmentFee > 0 && enrollmentFeeIsOverdue(input, s.enrolledAt);
    const enrollmentFeeOverdue = isEnrollmentFeeOverdue ? studentEnrollmentFee : 0;
    const enrollmentFeeUpcoming = isEnrollmentFeeOverdue ? 0 : studentEnrollmentFee;
    return {
      studentId: s.studentId,
      studentName: s.studentName,
      documentLabel: s.documentLabel,
      enrolledAt: s.enrolledAt,
      row,
      paid: agg.paid,
      pendingReview: agg.pendingReview,
      overdue: round2(agg.overdue + enrollmentFeeOverdue),
      upcoming: round2(agg.upcoming + enrollmentFeeUpcoming),
      expectedYear: round2(agg.expectedYear + studentEnrollmentFee),
      hasOverdue: agg.hasOverdue || enrollmentFeeOverdue > 0,
      enrollmentFee: {
        amount: enrollmentFee,
        expectedAmount: studentEnrollmentFee,
        exempt: Boolean(s.enrollmentFeeExempt),
        exemptReason: s.enrollmentExemptReason ?? null,
      },
      scholarships: s.scholarships,
      activeScholarshipDiscountPercent: activeScholarshipDiscountPercent(
        s.scholarships,
        input.todayYear,
        input.todayMonth,
      ),
      activePromotionLabel: s.activePromotionLabel ?? null,
    };
  });

  studentRows.sort((a, b) => a.studentName.localeCompare(b.studentName));

  return {
    sectionId: input.sectionId,
    sectionName: input.sectionName,
    cohortId: input.cohortId,
    cohortName: input.cohortName,
    year: input.todayYear,
    todayMonth: input.todayMonth,
    sectionStartsOn: input.sectionStartsOn,
    sectionEndsOn: input.sectionEndsOn,
    students: studentRows,
    kpis: buildSectionCollectionsKpis(studentRows),
  };
}

/**
 * Convenience: produce the cohort overview entry from an already built section
 * view (used by the cohort overview loader to keep the dependency graph
 * one-way: section view → cohort summary).
 */
export function toCohortCollectionsSectionSummary(
  view: SectionCollectionsView,
  archivedAt: string | null,
): CohortCollectionsSectionSummary {
  return {
    sectionId: view.sectionId,
    sectionName: view.sectionName,
    archivedAt,
    kpis: view.kpis,
  };
}
