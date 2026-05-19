"use client";

import { Tag } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { EnrollmentFeeChipStatus } from "@/lib/billing/resolveEnrollmentFeeChipStatus";

type MonthlyLabels = Dictionary["dashboard"]["student"]["monthly"];

function statusToken(status: EnrollmentFeeChipStatus): string {
  switch (status) {
    case "approved":
      return "border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]";
    case "pending":
      return "border-[var(--color-warning)] bg-[var(--color-warning)]/20 text-[var(--color-foreground)]";
    case "rejected":
      return "border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)]";
    case "exempt":
      return "border-[var(--color-info)] bg-[var(--color-info)]/15 text-[var(--color-info)]";
    default:
      return "border-[var(--color-warning)] bg-[var(--color-warning)]/15 text-[var(--color-foreground)] font-semibold";
  }
}

function statusLabel(status: EnrollmentFeeChipStatus, labels: MonthlyLabels): string {
  switch (status) {
    case "approved":
      return labels.statusApproved;
    case "pending":
      return labels.statusPending;
    case "rejected":
      return labels.statusRejected;
    case "exempt":
      return labels.statusExempt;
    default:
      return labels.statusDue;
  }
}

export interface StudentMonthlyEnrollmentFeeCellProps {
  chipLabel: string;
  status: EnrollmentFeeChipStatus;
  labels: MonthlyLabels;
  isFocused: boolean;
  onFocus: () => void;
}

export function StudentMonthlyEnrollmentFeeCell({
  chipLabel,
  status,
  labels,
  isFocused,
  onFocus,
}: StudentMonthlyEnrollmentFeeCellProps) {
  const aria = `${chipLabel}: ${statusLabel(status, labels)}`;
  const ringClasses = isFocused
    ? "ring-2 ring-[var(--color-primary)] ring-offset-2"
    : "ring-2 ring-[var(--color-primary)]/25";

  return (
    <button
      type="button"
      onClick={onFocus}
      aria-label={aria}
      title={aria}
      aria-pressed={isFocused}
      className={`flex min-h-[56px] min-w-[52px] shrink-0 flex-col items-center justify-center gap-1 self-end rounded-[var(--layout-border-radius)] border px-2 py-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${statusToken(status)} ${ringClasses}`}
    >
      <span className="text-[10px] uppercase tracking-wide opacity-90">{chipLabel}</span>
      <Tag className="h-4 w-4" aria-hidden />
    </button>
  );
}
