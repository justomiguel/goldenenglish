import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

/** Hover chrome around matrix chips (Finance cobranzas + admin billing matrícula strip). */
export const sectionCollectionsMatrixChipHoverFrame =
  "rounded-[var(--layout-border-radius)] border border-transparent p-0.5 transition-colors hover:border-[var(--color-primary)]/35 hover:bg-[var(--color-muted)]/20";

/**
 * Scholarship is a discount attribute, not a payment status. Violet stays off
 * the collected/overdue/pending palette so staff do not read "beca" as "pagado".
 * Inset shadow (not `ring`) so it does not collide with the selection ring.
 */
export const SECTION_COLLECTIONS_SCHOLARSHIP_MARK_CLASSES =
  "shadow-[inset_0_0_0_2px_#6d28d9]";

/** Percent label inside a month chip — same violet as the scholarship inset. */
export const SECTION_COLLECTIONS_SCHOLARSHIP_PERCENT_CLASSES = "text-[#6d28d9]";

/**
 * Must stay in lockstep with `SectionCollectionsMonthCell` in finance — same
 * color tokens the staff already reads in the cohort/section collection matrix.
 * Fill/border follow payment status; scholarship only adds the violet inset.
 */
export function sectionCollectionsMonthCellClasses(
  status: StudentMonthlyPaymentCell["status"],
  isOverdue: boolean,
  hasScholarshipDiscount: boolean,
): string {
  let statusClasses: string;
  switch (status) {
    case "approved":
      statusClasses =
        "border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]";
      break;
    case "pending":
      statusClasses =
        "border-[var(--color-warning)] bg-[var(--color-warning)]/20 text-[var(--color-foreground)]";
      break;
    case "rejected":
      statusClasses =
        "border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)]";
      break;
    case "exempt":
      statusClasses =
        "border-[var(--color-info)] bg-[var(--color-info)]/15 text-[var(--color-info)]";
      break;
    case "due":
      statusClasses = isOverdue
        ? "border-[var(--color-error)] bg-[var(--color-error)]/10 text-[var(--color-error)]"
        : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]";
      break;
    default:
      statusClasses =
        "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]";
  }
  if (hasScholarshipDiscount) {
    return `${statusClasses} ${SECTION_COLLECTIONS_SCHOLARSHIP_MARK_CLASSES}`;
  }
  return statusClasses;
}
