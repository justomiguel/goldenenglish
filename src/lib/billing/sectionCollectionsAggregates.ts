import { periodIndex } from "@/lib/billing/scholarshipPeriod";
import {
  SECTION_COLLECTIONS_HEALTH_THRESHOLDS,
  type SectionCollectionsHealth,
  type SectionCollectionsKpis,
  type SectionCollectionsStudentRow,
} from "@/types/sectionCollections";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

interface CellAggregates {
  paid: number;
  pendingReview: number;
  overdue: number;
  upcoming: number;
  expectedYear: number;
  hasOverdue: boolean;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function aggregateCells(
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

  for (const cell of cells) {
    const expected = cell.expectedAmount ?? 0;
    const recorded = cell.recordedAmount ?? 0;
    const isInPeriod =
      cell.status !== "out-of-period" && cell.status !== "no-plan";
    if (isInPeriod) expectedYear += expected;

    switch (cell.status) {
      case "approved":
        paid += recorded;
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

export function buildSectionCollectionsKpis(
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
  return {
    paid: round2(paid),
    pendingReview: round2(pendingReview),
    overdue: round2(overdue),
    upcoming: round2(upcoming),
    expectedYear: round2(expectedYear),
    collectionRatio: Math.round(collectionRatio * 1000) / 1000,
    totalStudents,
    overdueStudents,
    health: deriveHealth(
      collectionRatio,
      overdueStudents,
      totalStudents,
      expectedYear,
    ),
  };
}
