import {
  buildStudentMonthlyPaymentsRow,
  type StudentMonthlyPaymentRecord,
} from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import {
  effectiveScholarshipPercentForPeriod,
  periodIndex,
  type ScholarshipRow,
} from "@/lib/billing/scholarshipPeriod";
import {
  aggregateCells,
  buildSectionCollectionsKpis,
  round2,
} from "@/lib/billing/sectionCollectionsAggregates";
import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { SectionScheduleSlot } from "@/types/academics";
import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";
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

function yearMonthIndex(
  iso: string | null,
  fallbackYear: number,
  fallbackMonth: number,
): number {
  const raw = iso && iso.length >= 7
    ? iso.slice(0, 7)
    : `${fallbackYear}-${String(fallbackMonth).padStart(2, "0")}`;
  const [yearRaw, monthRaw] = raw.split("-").map((n) => Number(n));
  const dueYear = Number.isFinite(yearRaw) ? yearRaw : fallbackYear;
  const dueMonth = Number.isFinite(monthRaw) ? monthRaw : fallbackMonth;
  return periodIndex(dueYear, dueMonth);
}

function enrollmentFeeIsOverdue(
  input: BuildSectionCollectionsViewInput,
  enrolledAt: string | null,
): boolean {
  const sectionStartIdx = yearMonthIndex(
    input.sectionStartsOn,
    input.todayYear,
    input.todayMonth,
  );
  const enrolledIdx = enrolledAt
    ? yearMonthIndex(enrolledAt, input.todayYear, input.todayMonth)
    : sectionStartIdx;
  const todayIdx = periodIndex(input.todayYear, input.todayMonth);
  return Math.max(sectionStartIdx, enrolledIdx) < todayIdx;
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
