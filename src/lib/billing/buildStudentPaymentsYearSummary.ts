import { periodIndex } from "@/lib/billing/scholarshipPeriod";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

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

  for (const row of view.rows) {
    for (const cell of row.cells) {
      const expected = cell.expectedAmount ?? 0;
      const recorded = cell.recordedAmount ?? 0;
      const displayedRecorded = cell.fullMonthExpectedAmount ?? recorded;

      switch (cell.status) {
        case "approved": {
          paid += displayedRecorded;
          if (expected > 0 && recorded > expected) {
            creditBalance += recorded - expected;
          }
          break;
        }
        case "exempt": {
          break;
        }
        case "pending": {
          pendingReview += displayedRecorded > 0 ? displayedRecorded : expected;
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
          break;
        }
        default:
          break;
      }
    }
  }

  const totalDebtRaw = overdue + pendingReview + upcoming - creditBalance;
  const totalDebt = Math.max(0, totalDebtRaw);

  return {
    year: view.todayYear,
    paid: round2(paid),
    pendingReview: round2(pendingReview),
    overdue: round2(overdue),
    upcoming: round2(upcoming),
    creditBalance: round2(creditBalance),
    totalDebt: round2(totalDebt),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
