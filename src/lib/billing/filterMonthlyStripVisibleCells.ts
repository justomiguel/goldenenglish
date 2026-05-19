import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";
import { isPayableMonthlyCell } from "@/lib/billing/isSectionMonthlyPaymentsFullySettled";

export interface FilterMonthlyStripVisibleCellsOptions {
  /** PWA: omit no-plan and out-of-period months without a fee. */
  hideNonBillableMonths: boolean;
}

export function filterMonthlyStripVisibleCells(
  cells: StudentMonthlyPaymentCell[],
  options: FilterMonthlyStripVisibleCellsOptions,
): StudentMonthlyPaymentCell[] {
  return cells.filter((cell) => {
    if (options.hideNonBillableMonths && !isPayableMonthlyCell(cell)) {
      return false;
    }
    return true;
  });
}

/** First cell to focus when opening the strip (prefers current month if visible). */
export function pickDefaultMonthlyStripFocusMonth(
  cells: StudentMonthlyPaymentCell[],
  options: FilterMonthlyStripVisibleCellsOptions,
  todayMonth: number,
): number | null {
  const visible = filterMonthlyStripVisibleCells(cells, options);
  if (visible.length === 0) return null;
  const current = visible.find((c) => c.isCurrent);
  if (current) return current.month;
  const today = visible.find((c) => c.month === todayMonth);
  if (today) return today.month;
  return visible[0]!.month;
}
