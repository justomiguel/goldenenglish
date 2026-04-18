import {
  buildStudentMonthlyPaymentsRow,
  type StudentMonthlyPaymentRecord,
} from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import { periodIndex, type ScholarshipRow } from "@/lib/billing/scholarshipPeriod";
import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { SectionScheduleSlot } from "@/types/academics";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import {
  SECTION_COLLECTIONS_HEALTH_THRESHOLDS,
  type CohortCollectionsSectionSummary,
  type SectionCollectionsHealth,
  type SectionCollectionsKpis,
  type SectionCollectionsStudentRow,
  type SectionCollectionsView,
} from "@/types/sectionCollections";

export interface SectionCollectionsStudentInput {
  studentId: string;
  studentName: string;
  documentLabel: string | null;
  scholarship: ScholarshipRow | null;
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

interface CellAggregates {
  paid: number;
  pendingReview: number;
  overdue: number;
  upcoming: number;
  expectedYear: number;
  hasOverdue: boolean;
  hasInPeriod: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function aggregateCells(
  cells: readonly StudentMonthlyPaymentCell[],
  todayYear: number,
  todayMonth: number,
): CellAggregates {
  const todayIdx = periodIndex(todayYear, todayMonth);
  let paid = 0;
  let pendingReview = 0;
  let overdue = 0;
  let upcoming = 0;
  let expectedYear = 0;
  let hasOverdue = false;
  let hasInPeriod = false;
  for (const cell of cells) {
    const expected = cell.expectedAmount ?? 0;
    const recorded = cell.recordedAmount ?? 0;
    const isInPeriod =
      cell.status !== "out-of-period" && cell.status !== "no-plan";
    if (isInPeriod) {
      hasInPeriod = true;
      expectedYear += expected;
    }
    switch (cell.status) {
      case "approved":
        paid += recorded;
        break;
      case "exempt":
        break;
      case "pending":
        pendingReview += recorded > 0 ? recorded : expected;
        break;
      case "due":
      case "rejected": {
        const cellIdx = periodIndex(cell.year, cell.month);
        if (cellIdx < todayIdx) {
          overdue += expected;
          hasOverdue = true;
        } else {
          upcoming += expected;
        }
        break;
      }
      default:
        break;
    }
  }
  return {
    paid: round2(paid),
    pendingReview: round2(pendingReview),
    overdue: round2(overdue),
    upcoming: round2(upcoming),
    expectedYear: round2(expectedYear),
    hasOverdue,
    hasInPeriod,
  };
}

function deriveHealth(
  collectionRatio: number,
  overdueStudents: number,
  totalStudents: number,
  expectedYear: number,
): SectionCollectionsHealth {
  if (totalStudents === 0 || expectedYear === 0) return "watch";
  const t = SECTION_COLLECTIONS_HEALTH_THRESHOLDS;
  const overdueShare = overdueStudents / totalStudents;
  if (
    collectionRatio < t.criticalMaxRatio ||
    overdueShare >= t.watchOverdueShare
  ) {
    return "critical";
  }
  if (collectionRatio >= t.healthyMinRatio && overdueStudents === 0) {
    return "healthy";
  }
  return "watch";
}

function buildKpis(
  studentRows: readonly SectionCollectionsStudentRow[],
): SectionCollectionsKpis {
  let paid = 0;
  let pendingReview = 0;
  let overdue = 0;
  let upcoming = 0;
  let expectedYear = 0;
  let totalStudents = 0;
  let overdueStudents = 0;
  for (const s of studentRows) {
    paid += s.paid;
    pendingReview += s.pendingReview;
    overdue += s.overdue;
    upcoming += s.upcoming;
    expectedYear += s.expectedYear;
    if (s.expectedYear > 0 || s.paid > 0 || s.pendingReview > 0) {
      totalStudents += 1;
    }
    if (s.hasOverdue) overdueStudents += 1;
  }
  const collectionRatio = expectedYear > 0 ? Math.min(1, paid / expectedYear) : 0;
  const health = deriveHealth(
    collectionRatio,
    overdueStudents,
    totalStudents,
    expectedYear,
  );
  return {
    paid: round2(paid),
    pendingReview: round2(pendingReview),
    overdue: round2(overdue),
    upcoming: round2(upcoming),
    expectedYear: round2(expectedYear),
    collectionRatio: Math.round(collectionRatio * 1000) / 1000,
    totalStudents,
    overdueStudents,
    health,
  };
}

/**
 * Pure: build the admin section collections view by reusing the per-student
 * row builder, then aggregating per student and per section.
 */
export function buildSectionCollectionsView(
  input: BuildSectionCollectionsViewInput,
): SectionCollectionsView {
  const studentRows: SectionCollectionsStudentRow[] = input.students.map((s) => {
    const row: StudentMonthlyPaymentSectionRow = buildStudentMonthlyPaymentsRow({
      sectionId: input.sectionId,
      sectionName: input.sectionName,
      cohortName: input.cohortName,
      plans: input.plans,
      payments: s.payments,
      scholarship: s.scholarship,
      todayYear: input.todayYear,
      todayMonth: input.todayMonth,
      sectionStartsOn: input.sectionStartsOn,
      sectionEndsOn: input.sectionEndsOn,
      studentEnrolledAt: s.enrolledAt,
      scheduleSlots: input.scheduleSlots,
      sectionEnrollmentFeeAmount: input.sectionEnrollmentFeeAmount,
    });
    const agg = aggregateCells(row.cells, input.todayYear, input.todayMonth);
    return {
      studentId: s.studentId,
      studentName: s.studentName,
      documentLabel: s.documentLabel,
      row,
      paid: agg.paid,
      pendingReview: agg.pendingReview,
      overdue: agg.overdue,
      upcoming: agg.upcoming,
      expectedYear: agg.expectedYear,
      hasOverdue: agg.hasOverdue,
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
    kpis: buildKpis(studentRows),
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
