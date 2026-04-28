"use client";

import { sectionCollectionsMonthCellClasses } from "@/lib/billing/sectionCollectionsMonthCellClasses";
import { SECTION_COLLECTIONS_MONTH_STATUS_ICONS } from "@/lib/billing/sectionCollectionsMonthStatusIcons";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

export interface EnrollmentFeeMatrixChipProps {
  ariaLabel: string;
  visual: { status: StudentMonthlyPaymentCell["status"]; isOverdue: boolean } | null;
  /** When the chip sits inside a parent button, hide its accessible name (parent provides it). */
  decoratesParentButton?: boolean;
}

/** Shared “month 0” enrollment fee chip (Finance matrices + admin billing grid). */
export function EnrollmentFeeMatrixChip({
  ariaLabel,
  visual,
  decoratesParentButton = false,
}: EnrollmentFeeMatrixChipProps) {
  if (visual == null) {
    return (
      <span className="text-[10px] text-[var(--color-muted-foreground)]" aria-hidden>
        —
      </span>
    );
  }
  const Icon = SECTION_COLLECTIONS_MONTH_STATUS_ICONS[visual.status];
  const cellClass = sectionCollectionsMonthCellClasses(
    visual.status,
    visual.isOverdue,
    false,
  );
  return (
    <span
      aria-hidden={decoratesParentButton ? true : undefined}
      aria-label={decoratesParentButton ? undefined : ariaLabel}
      title={decoratesParentButton ? undefined : ariaLabel}
      className={`inline-flex h-8 min-w-[34px] flex-col items-center justify-center rounded border text-[10px] font-semibold leading-none ${cellClass}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}
