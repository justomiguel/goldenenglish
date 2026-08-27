import { round2 } from "@/lib/billing/sectionCollectionsAggregates";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

function isBillableMonth(cell: StudentMonthlyPaymentCell): boolean {
  return cell.status !== "no-plan" && cell.status !== "out-of-period";
}

function monthHasDiscount(cell: StudentMonthlyPaymentCell): boolean {
  if (cell.status === "exempt") return true;
  if ((cell.scholarshipDiscountPercent ?? 0) > 0) return true;
  const original = cell.fullMonthOriginalExpectedAmount;
  const expected = cell.fullMonthExpectedAmount;
  return original != null && expected != null && expected < original;
}

function effectiveFullMonthAmount(cell: StudentMonthlyPaymentCell): number {
  if (cell.status === "exempt") return 0;
  return cell.fullMonthExpectedAmount ?? cell.expectedAmount ?? 0;
}

/**
 * Average full-month amount the student pays across billable months after
 * scholarships / exemptions. Null when nothing is discounted so the list
 * price stays the only figure shown.
 */
export function discountedAverageMonthlyFeeFromCells(
  cells: readonly StudentMonthlyPaymentCell[] | null | undefined,
): number | null {
  if (!cells?.length) return null;
  const billable = cells.filter(isBillableMonth);
  if (billable.length === 0) return null;
  if (!billable.some(monthHasDiscount)) return null;

  const sum = billable.reduce((acc, cell) => acc + effectiveFullMonthAmount(cell), 0);
  return round2(sum / billable.length);
}
