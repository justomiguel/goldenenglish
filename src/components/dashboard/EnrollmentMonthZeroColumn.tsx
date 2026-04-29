"use client";

import { FileText } from "lucide-react";
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
  /** Link label to open uploaded enrollment receipt (pending + URL only). */
  viewReceipt: string;
}

export interface EnrollmentMonthZeroColumnProps {
  visual: { status: StudentMonthlyPaymentCell["status"]; isOverdue: boolean } | null;
  ariaLabel: string;
  labels: EnrollmentMonthZeroColumnLabels;
  /** When set, the column is a button that opens enrollment fee actions (modal). */
  onActivate?: () => void;
  disabled?: boolean;
  /** Pre-signed URL for student-uploaded enrollment receipt. */
  receiptSignedUrl?: string | null;
}

/** Month “0” strip (enrollment fee) for admin record-payment grid; optionally opens enrollment UI. */
export function EnrollmentMonthZeroColumn({
  visual,
  ariaLabel,
  labels,
  onActivate,
  disabled = false,
  receiptSignedUrl = null,
}: EnrollmentMonthZeroColumnProps) {
  const statusText =
    visual == null ? "" : enrollmentFeeMatrixStatusLabel(visual, labels);
  const interactive = Boolean(onActivate);
  const receiptTrimmed =
    visual?.status === "pending" && receiptSignedUrl != null
      ? String(receiptSignedUrl).trim()
      : "";
  const showViewReceipt = receiptTrimmed.length > 0;

  const chip = (
    <EnrollmentFeeMatrixChip
      ariaLabel={ariaLabel}
      visual={visual}
      decoratesParentButton={interactive}
    />
  );

  const columnBody = (
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

  const mainControl =
    interactive && onActivate ? (
      <button
        type="button"
        disabled={disabled}
        onClick={onActivate}
        aria-label={labels.enrollmentColumnActivate}
        className={`flex w-full min-w-[2.5rem] flex-1 flex-col items-center gap-0.5 text-left outline-none ${sectionCollectionsMatrixChipHoverFrame} focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50`}
      >
        {columnBody}
      </button>
    ) : (
      <div className="flex w-full min-w-[2.5rem] flex-1 flex-col items-center gap-0.5">
        {columnBody}
      </div>
    );

  return (
    <div className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-1">
      {mainControl}
      {showViewReceipt ? (
        <a
          href={receiptTrimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] w-full max-w-[5.5rem] items-center justify-center gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-muted)]/25"
        >
          <FileText className="h-3 w-3 shrink-0" aria-hidden />
          {labels.viewReceipt}
        </a>
      ) : null}
    </div>
  );
}
