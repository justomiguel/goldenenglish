import {
  sectionCollectionsMatrixChipHoverFrame,
  sectionCollectionsMonthCellClasses,
} from "@/lib/billing/sectionCollectionsMonthCellClasses";
import { SECTION_COLLECTIONS_MONTH_STATUS_ICONS } from "@/lib/billing/sectionCollectionsMonthStatusIcons";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

export interface SectionCollectionsMonthCellProps {
  cell: StudentMonthlyPaymentCell;
  monthLabel: string;
  todayMonth: number;
  year: number;
  scholarshipDiscountPercent?: number | null;
  ariaPrefix: string;
  locale: string;
  labels: {
    statusApproved: string;
    statusPending: string;
    statusRejected: string;
    statusExempt: string;
    statusDue: string;
    statusOutOfPeriod: string;
    statusNoPlan: string;
    expectedAmount: string;
  };
}

function statusLabel(
  status: StudentMonthlyPaymentCell["status"],
  labels: SectionCollectionsMonthCellProps["labels"],
): string {
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
    case "no-plan":
      return labels.statusNoPlan;
  }
}

function formatExpectedAmount(
  cell: StudentMonthlyPaymentCell,
  locale: string,
): string | null {
  if (cell.expectedAmount == null || cell.currency == null) return null;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: cell.currency,
    maximumFractionDigits: 2,
  }).format(cell.expectedAmount);
}

export function SectionCollectionsMonthCell({
  cell,
  monthLabel,
  todayMonth,
  year,
  scholarshipDiscountPercent,
  ariaPrefix,
  locale,
  labels,
}: SectionCollectionsMonthCellProps) {
  const Icon = SECTION_COLLECTIONS_MONTH_STATUS_ICONS[cell.status];
  const cellIdx = cell.year * 12 + cell.month;
  const todayIdx = year * 12 + todayMonth;
  const isOverdue = cell.status === "due" && cellIdx < todayIdx;
  const expectedAmount = formatExpectedAmount(cell, locale);
  const hasScholarshipDiscount = scholarshipDiscountPercent != null;
  const aria = [
    ariaPrefix,
    monthLabel,
    statusLabel(cell.status, labels),
    hasScholarshipDiscount ? `${scholarshipDiscountPercent}%` : null,
    expectedAmount ? `${labels.expectedAmount}: ${expectedAmount}` : null,
  ].filter(Boolean).join(" · ");
  return (
    <span className={`inline-flex ${sectionCollectionsMatrixChipHoverFrame}`}>
      <span
        aria-label={aria}
        title={aria}
        className={`inline-flex h-8 min-w-[34px] flex-col items-center justify-center rounded border text-[10px] font-semibold leading-none ${sectionCollectionsMonthCellClasses(cell.status, isOverdue, hasScholarshipDiscount)}`}
      >
        {hasScholarshipDiscount ? (
          <>
            <span>{scholarshipDiscountPercent}%</span>
            <Icon className="mt-0.5 h-2.5 w-2.5" aria-hidden />
          </>
        ) : (
          <Icon className="h-3.5 w-3.5" aria-hidden />
        )}
      </span>
    </span>
  );
}
