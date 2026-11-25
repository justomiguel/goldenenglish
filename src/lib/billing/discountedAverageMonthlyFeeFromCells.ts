import { round2 } from "@/lib/billing/sectionCollectionsAggregates";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

function isBillableMonth(cell: StudentMonthlyPaymentCell): boolean {
  return cell.status !== "no-plan" && cell.status !== "out-of-period";
}

function hasScholarshipReduction(cell: StudentMonthlyPaymentCell): boolean {
  if ((cell.scholarshipDiscountPercent ?? 0) > 0) return true;
  const original = cell.fullMonthOriginalExpectedAmount;
  const expected = cell.fullMonthExpectedAmount;
  return original != null && expected != null && expected < original;
}

/** Exempt with no scholarship. That month is not charged and stays out of the average. */
function isPlainExemption(cell: StudentMonthlyPaymentCell): boolean {
  return cell.status === "exempt" && !hasScholarshipReduction(cell);
}

function effectiveFullMonthAmount(cell: StudentMonthlyPaymentCell): number {
  if (cell.status === "exempt") return 0;
  return cell.fullMonthExpectedAmount ?? cell.expectedAmount ?? 0;
}

/**
 * Average full-month amount after scholarships. Null when no scholarship
 * lowers a month, so the list price stays the only figure shown.
 * A plain exemption is left out. It does not count as 0.
 */
export function discountedAverageMonthlyFeeFromCells(
  cells: readonly StudentMonthlyPaymentCell[] | null | undefined,
): number | null {
  if (!cells?.length) return null;
  const counted = cells.filter((cell) => isBillableMonth(cell) && !isPlainExemption(cell));
  if (counted.length === 0) return null;
  if (!counted.some(hasScholarshipReduction)) return null;

  const sum = counted.reduce((acc, cell) => acc + effectiveFullMonthAmount(cell), 0);
  return round2(sum / counted.length);
}
