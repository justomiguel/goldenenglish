import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

/** Hover chrome around matrix chips (Finance cobranzas + admin billing matrícula strip). */
export const sectionCollectionsMatrixChipHoverFrame =
  "rounded-[var(--layout-border-radius)] border border-transparent p-0.5 transition-colors hover:border-[var(--color-primary)]/35 hover:bg-[var(--color-muted)]/20";

/**
 * Must stay in lockstep with `SectionCollectionsMonthCell` in finance — same
 * color tokens the staff already reads in the cohort/section collection matrix.
 */
export function sectionCollectionsMonthCellClasses(
  status: StudentMonthlyPaymentCell["status"],
  isOverdue: boolean,
  hasScholarshipDiscount: boolean,
): string {
  if (hasScholarshipDiscount) {
    return "border-[var(--color-success)] bg-[var(--color-success)]/20 text-[var(--color-success)] shadow-[inset_0_0_0_1px_var(--color-success)]";
  }
  switch (status) {
    case "approved":
      return "border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]";
    case "pending":
      return "border-[var(--color-warning)] bg-[var(--color-warning)]/20 text-[var(--color-foreground)]";
    case "rejected":
      return "border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)]";
    case "exempt":
      return "border-[var(--color-info)] bg-[var(--color-info)]/15 text-[var(--color-info)]";
    case "due":
      return isOverdue
        ? "border-[var(--color-error)] bg-[var(--color-error)]/10 text-[var(--color-error)]"
        : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]";
    default:
      return "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]";
  }
}
