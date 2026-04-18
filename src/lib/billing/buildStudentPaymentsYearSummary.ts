import { periodIndex } from "@/lib/billing/scholarshipPeriod";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
  StudentMonthlyPaymentsView,
} from "@/types/studentMonthlyPayments";

export interface StudentPaymentsYearSummaryNextDue {
  year: number;
  month: number;
  sectionId: string;
  sectionName: string;
  amount: number;
}

export interface StudentPaymentsYearSummary {
  year: number;
  /** Approved cells (recordedAmount) plus exempt cells (counted as 0). */
  paid: number;
  /** Pending status cells (recordedAmount when present, expectedAmount as fallback). */
  pendingReview: number;
  /** In-period due/rejected cells before (todayYear, todayMonth). */
  overdue: number;
  /** In-period due cells from (todayYear, todayMonth) onward. */
  upcoming: number;
  /** Surplus from over-payments on approved cells (recordedAmount > expectedAmount). */
  creditBalance: number;
  /** overdue + pendingReview + upcoming, minus credit balance, floored at 0. */
  totalDebt: number;
  /** Earliest in-period due/rejected cell across all sections (or null). */
  nextDue: StudentPaymentsYearSummaryNextDue | null;
}

interface RowCell {
  cell: StudentMonthlyPaymentCell;
  row: StudentMonthlyPaymentSectionRow;
}

function compareNextDue(a: RowCell, b: RowCell): number {
  const ai = periodIndex(a.cell.year, a.cell.month);
  const bi = periodIndex(b.cell.year, b.cell.month);
  if (ai !== bi) return ai - bi;
  return a.row.sectionName.localeCompare(b.row.sectionName);
}

/**
 * Pure aggregator over a `StudentMonthlyPaymentsView`. All amounts are taken
 * post-scholarship from the view (the loader already applied the discount to
 * `expectedAmount`). Credits in favor are inferred from approved over-payments
 * because there is no explicit `student_credits` table yet (see ADR
 * 2026-04-student-payments-year-summary).
 */
export function buildStudentPaymentsYearSummary(
  view: StudentMonthlyPaymentsView,
): StudentPaymentsYearSummary {
  const todayIdx = periodIndex(view.todayYear, view.todayMonth);
  let paid = 0;
  let pendingReview = 0;
  let overdue = 0;
  let upcoming = 0;
  let creditBalance = 0;
  let nextDueCandidate: RowCell | null = null;

  for (const row of view.rows) {
    for (const cell of row.cells) {
      const expected = cell.expectedAmount ?? 0;
      const recorded = cell.recordedAmount ?? 0;

      switch (cell.status) {
        case "approved": {
          paid += recorded;
          if (expected > 0 && recorded > expected) {
            creditBalance += recorded - expected;
          }
          break;
        }
        case "exempt": {
          break;
        }
        case "pending": {
          pendingReview += recorded > 0 ? recorded : expected;
          break;
        }
        case "due":
        case "rejected": {
          const cellIdx = periodIndex(cell.year, cell.month);
          if (cellIdx < todayIdx) {
            overdue += expected;
          } else {
            upcoming += expected;
          }
          const candidate = { cell, row };
          if (
            nextDueCandidate == null ||
            compareNextDue(candidate, nextDueCandidate) < 0
          ) {
            nextDueCandidate = candidate;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  const totalDebtRaw = overdue + pendingReview + upcoming - creditBalance;
  const totalDebt = Math.max(0, totalDebtRaw);

  const nextDue: StudentPaymentsYearSummaryNextDue | null = nextDueCandidate
    ? {
        year: nextDueCandidate.cell.year,
        month: nextDueCandidate.cell.month,
        sectionId: nextDueCandidate.row.sectionId,
        sectionName: nextDueCandidate.row.sectionName,
        amount: nextDueCandidate.cell.expectedAmount ?? 0,
      }
    : null;

  return {
    year: view.todayYear,
    paid: round2(paid),
    pendingReview: round2(pendingReview),
    overdue: round2(overdue),
    upcoming: round2(upcoming),
    creditBalance: round2(creditBalance),
    totalDebt: round2(totalDebt),
    nextDue,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
