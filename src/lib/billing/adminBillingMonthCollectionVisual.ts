import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import { periodIndex } from "@/lib/billing/scholarshipPeriod";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

/** Map one Finance / Cobranzas cell to collection-matrix chip visuals (incl. overdue for `due`). */
function collectionCellToChipVisual(
  collectionCell: StudentMonthlyPaymentCell,
  viewYear: number,
  todayYear: number,
  todayMonth: number,
): {
  status: StudentMonthlyPaymentCell["status"];
  isOverdue: boolean;
  hasScholarshipDiscount: boolean;
} {
  const hasSch = collectionCell.scholarshipDiscountPercent != null;
  const cellIdx = periodIndex(viewYear, collectionCell.month);
  const todayIdx = periodIndex(todayYear, todayMonth);
  if (collectionCell.status === "due") {
    return {
      status: "due",
      isOverdue: cellIdx < todayIdx,
      hasScholarshipDiscount: hasSch,
    };
  }
  return {
    status: collectionCell.status,
    isOverdue: false,
    hasScholarshipDiscount: hasSch,
  };
}

/**
 * Merge Cobranzas-style cells (`buildStudentMonthlyPaymentsRow`) with legacy-only
 * periods (`legacyFallback`). When `collectionCell` is present and not legacy, the
 * chip follows row logic (e.g. pending-without-receipt → `due`).
 */
export function resolveAdminBillingMonthChipVisual(
  monthState: AdminBillingMonthState,
  collectionCell: StudentMonthlyPaymentCell | null | undefined,
  viewYear: number,
  todayYear: number,
  todayMonth: number,
): {
  status: StudentMonthlyPaymentCell["status"];
  isOverdue: boolean;
  hasScholarshipDiscount: boolean;
} {
  if (monthState.legacyFallback) {
    return adminMonthStateToCollectionVisual(monthState, viewYear, todayYear, todayMonth);
  }
  if (collectionCell) {
    return collectionCellToChipVisual(collectionCell, viewYear, todayYear, todayMonth);
  }
  return adminMonthStateToCollectionVisual(monthState, viewYear, todayYear, todayMonth);
}

/**
 * Reuse the same visual semantics as the Finance collections matrix
 * (`SectionCollectionsMonthCell` / `sectionCollectionsMonthCellClasses`).
 */
export function adminMonthStateToCollectionVisual(
  state: AdminBillingMonthState,
  viewYear: number,
  todayYear: number,
  todayMonth: number,
): {
  status: StudentMonthlyPaymentCell["status"];
  isOverdue: boolean;
  hasScholarshipDiscount: boolean;
} {
  const hasSch = state.scholarshipPercent != null;
  const cellIdx = periodIndex(viewYear, state.month);
  const todayIdx = periodIndex(todayYear, todayMonth);
  switch (state.status) {
    case "paid":
      return { status: "approved", isOverdue: false, hasScholarshipDiscount: hasSch };
    case "pending":
      return { status: "pending", isOverdue: false, hasScholarshipDiscount: hasSch };
    case "rejected":
      return { status: "rejected", isOverdue: false, hasScholarshipDiscount: hasSch };
    case "exempt":
      return { status: "exempt", isOverdue: false, hasScholarshipDiscount: hasSch };
    case "unpaid":
      return {
        status: "due",
        isOverdue: cellIdx < todayIdx,
        hasScholarshipDiscount: hasSch,
      };
  }
}
