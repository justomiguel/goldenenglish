"use client";

import type { Dictionary } from "@/types/i18n";
import { SECTION_COLLECTIONS_MONTH_STATUS_ICONS } from "@/lib/billing/sectionCollectionsMonthStatusIcons";
import type {
  StudentMonthlyPaymentCell as Cell,
  StudentMonthlyPaymentCellStatus,
} from "@/types/studentMonthlyPayments";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

function statusToken(status: StudentMonthlyPaymentCellStatus): string {
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
      return "border-[var(--color-warning)] bg-[var(--color-warning)]/15 text-[var(--color-foreground)] font-semibold";
    default:
      return "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]";
  }
}

function statusLabel(status: StudentMonthlyPaymentCellStatus, labels: Labels): string {
  switch (status) {
    case "approved":
      return labels.statusApproved;
    case "pending":
      return labels.statusPending;
    case "rejected":
      return labels.statusRejected;
    case "exempt":
      return labels.statusExempt;
    case "due":
      return labels.statusDue;
    case "out-of-period":
      return labels.statusOutOfPeriod;
    default:
      return labels.statusNoPlan;
  }
}

export interface StudentMonthlyPaymentCellProps {
  cell: Cell;
  monthLabel: string;
  labels: Labels;
  isFocused: boolean;
  onFocus: () => void;
  /** PWA accordion: enlarge the current calendar month. */
  emphasizeCurrentMonth?: boolean;
}

export function StudentMonthlyPaymentCell({
  cell,
  monthLabel,
  labels,
  isFocused,
  onFocus,
  emphasizeCurrentMonth = false,
}: StudentMonthlyPaymentCellProps) {
  const Icon = SECTION_COLLECTIONS_MONTH_STATUS_ICONS[cell.status];
  const tokenClasses = statusToken(cell.status);
  const isDisabled =
    cell.status === "no-plan" ||
    (cell.status === "out-of-period" && cell.expectedAmount == null);
  const scholarshipLabel =
    cell.scholarshipDiscountPercent != null
      ? `${cell.scholarshipDiscountPercent}%`
      : null;
  const aria = [
    `${monthLabel}: ${statusLabel(cell.status, labels)}`,
    scholarshipLabel,
    cell.isCurrent ? labels.currentMonth : null,
  ].filter(Boolean).join(" · ");
  const ringClasses = isFocused
    ? "ring-2 ring-[var(--color-primary)] ring-offset-2"
    : !emphasizeCurrentMonth && cell.isCurrent
      ? "ring-2 ring-[var(--color-primary)]/40"
      : "";
  const isEmphasized = emphasizeCurrentMonth && cell.isCurrent;
  const sizeClasses = isEmphasized
    ? "z-[1] min-h-[72px] min-w-[50px] shrink-0 scale-110 px-2.5 py-2.5 text-sm shadow-md"
    : "min-h-[56px] min-w-[44px] shrink-0 px-2 py-2 text-xs";
  const monthLabelClasses = isEmphasized
    ? "text-xs uppercase tracking-wide opacity-90 font-semibold"
    : "text-[10px] uppercase tracking-wide opacity-80";
  return (
    <button
      type="button"
      onClick={onFocus}
      disabled={isDisabled && !cell.isCurrent}
      aria-label={aria}
      title={aria}
      aria-pressed={isFocused}
      className={`flex flex-col items-center justify-center gap-1 self-end rounded-[var(--layout-border-radius)] border font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses} ${tokenClasses} ${ringClasses}`}
    >
      <span className={monthLabelClasses}>{monthLabel}</span>
      {scholarshipLabel ? (
        <span className="text-[11px] font-bold leading-none">{scholarshipLabel}</span>
      ) : (
        <Icon className={isEmphasized ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      )}
      {cell.isCurrent ? (
        <span className="sr-only">{labels.currentMonth}</span>
      ) : null}
    </button>
  );
}
