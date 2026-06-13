import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";
import {
  isMonthlyCellSettled,
  isPayableMonthlyCell,
  isUnsettledPayableMonthlyCell,
} from "@/lib/billing/isSectionMonthlyPaymentsFullySettled";

export interface FilterMonthlyStripVisibleCellsOptions {
  /** PWA / parent: omit no-plan and out-of-period months without a fee. */
  hideNonBillableMonths: boolean;
  /** Parent PWA: show only months still owed or under review (includes past overdue). */
  hideSettledMonths?: boolean;
}

function isOverdueUnsettledCell(
  cell: StudentMonthlyPaymentCell,
  todayMonth: number,
): boolean {
  if (cell.month > todayMonth) return false;
  if (cell.status === "due" || cell.status === "rejected") return true;
  return cell.status === "pending" && cell.paymentId != null;
}

export function filterMonthlyStripVisibleCells(
  cells: StudentMonthlyPaymentCell[],
  options: FilterMonthlyStripVisibleCellsOptions,
): StudentMonthlyPaymentCell[] {
  return cells.filter((cell) => {
    if (options.hideNonBillableMonths && !isPayableMonthlyCell(cell)) {
      return false;
    }
    if (options.hideSettledMonths && isMonthlyCellSettled(cell)) {
      return false;
    }
    return true;
  });
}

/** First cell to focus when opening the strip. */
export function pickDefaultMonthlyStripFocusMonth(
  cells: StudentMonthlyPaymentCell[],
  options: FilterMonthlyStripVisibleCellsOptions,
  todayMonth: number,
): number | null {
  const visible = filterMonthlyStripVisibleCells(cells, options);
  if (visible.length === 0) return null;

  if (options.hideSettledMonths) {
    const overdue = visible
      .filter((c) => isOverdueUnsettledCell(c, todayMonth))
      .sort((a, b) => a.month - b.month);
    if (overdue.length > 0) return overdue[0]!.month;

    const unsettled = visible
      .filter((c) => isUnsettledPayableMonthlyCell(c))
      .sort((a, b) => a.month - b.month);
    if (unsettled.length > 0) return unsettled[0]!.month;

    return visible[0]!.month;
  }

  const current = visible.find((c) => c.isCurrent);
  if (current) return current.month;
  const today = visible.find((c) => c.month === todayMonth);
  if (today) return today.month;
  return visible[0]!.month;
}
