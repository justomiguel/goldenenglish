"use client";

import { EnrollmentFeeMatrixChip } from "@/components/dashboard/EnrollmentFeeMatrixChip";
import { enrollmentFeeMatrixStatusLabel } from "@/lib/billing/enrollmentFeeMatrixStatusLabel";
import { sectionCollectionsMatrixChipHoverFrame } from "@/lib/billing/sectionCollectionsMonthCellClasses";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

export interface EnrollmentMonthZeroColumnLabels {
  statusPaid: string;
  statusPending: string;
  statusRejected: string;
  statusExempt: string;
  statusUnpaid: string;
  statusOverdue: string;
  monthZeroColumnShort: string;
  monthZeroTooltip: string;
  /** Accessible name when the column opens enrollment settings (parent button). */
  enrollmentColumnActivate: string;
}

export interface EnrollmentMonthZeroColumnProps {
  visual: { status: StudentMonthlyPaymentCell["status"]; isOverdue: boolean } | null;
  ariaLabel: string;
  labels: EnrollmentMonthZeroColumnLabels;
  /** When set, the column is a button that opens enrollment fee actions (modal). */
  onActivate?: () => void;
  disabled?: boolean;
}

/** Month “0” strip (enrollment fee) for admin record-payment grid; optionally opens enrollment UI. */
export function EnrollmentMonthZeroColumn({
  visual,
  ariaLabel,
  labels,
  onActivate,
  disabled = false,
}: EnrollmentMonthZeroColumnProps) {
  const statusText =
    visual == null ? "" : enrollmentFeeMatrixStatusLabel(visual, labels);
  const interactive = Boolean(onActivate);

  const chip = (
    <EnrollmentFeeMatrixChip
      ariaLabel={ariaLabel}
      visual={visual}
      decoratesParentButton={interactive}
    />
  );

  const inner = (
    <>
      <abbr
        title={labels.monthZeroTooltip}
        className="w-full truncate text-center text-[10px] font-medium text-[var(--color-muted-foreground)] no-underline"
      >
        {labels.monthZeroColumnShort}
      </abbr>
      <div className="box-border flex h-8 w-full min-w-[34px] max-w-[52px] flex-col items-center justify-center">
        {chip}
      </div>
      <span
        className="w-full break-words text-center text-[9px] leading-tight text-[var(--color-muted-foreground)]"
        aria-hidden
      >
        {statusText}
      </span>
    </>
  );

  if (interactive && onActivate) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onActivate}
        aria-label={labels.enrollmentColumnActivate}
        className={`flex min-w-[2.5rem] flex-1 flex-col items-center gap-0.5 text-left outline-none ${sectionCollectionsMatrixChipHoverFrame} focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-0.5">{inner}</div>
  );
}
