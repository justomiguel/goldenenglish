"use client";

import { Check, CircleDot, Clock, FileText, Lock, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type {
  StudentMonthlyPaymentCell as Cell,
  StudentMonthlyPaymentCellStatus,
} from "@/types/studentMonthlyPayments";

type Labels = Dictionary["dashboard"]["student"]["monthly"];

const STATUS_ICON: Record<StudentMonthlyPaymentCellStatus, LucideIcon> = {
  approved: Check,
  pending: Clock,
  rejected: X,
  exempt: FileText,
  due: CircleDot,
  "out-of-period": Lock,
  "no-plan": Lock,
};

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
      return "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]";
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
}

export function StudentMonthlyPaymentCell({
  cell,
  monthLabel,
  labels,
  isFocused,
  onFocus,
}: StudentMonthlyPaymentCellProps) {
  const Icon = STATUS_ICON[cell.status];
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
    : cell.isCurrent
      ? "ring-2 ring-[var(--color-primary)]/40"
      : "";
  return (
    <button
      type="button"
      onClick={onFocus}
      disabled={isDisabled && !cell.isCurrent}
      aria-label={aria}
      title={aria}
      aria-pressed={isFocused}
      className={`flex min-h-[64px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-[var(--layout-border-radius)] border px-2 py-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${tokenClasses} ${ringClasses}`}
    >
      <span className="text-[10px] uppercase tracking-wide opacity-80">{monthLabel}</span>
      {scholarshipLabel ? (
        <span className="text-[11px] font-bold leading-none">{scholarshipLabel}</span>
      ) : (
        <Icon className="h-4 w-4" aria-hidden />
      )}
      {cell.isCurrent ? (
        <span className="sr-only">{labels.currentMonth}</span>
      ) : null}
    </button>
  );
}
