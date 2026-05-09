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
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (month: number) => void;
  /** System-wide billing currency from Finance > Settings. */
  currency?: string;
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
  currency: string | undefined,
): string | null {
  if (cell.expectedAmount == null) return null;
  const currencyCode = currency ?? cell.currency ?? "USD";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
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
  selectable = false,
  selected = false,
  onToggle,
  currency,
}: SectionCollectionsMonthCellProps) {
  const Icon = SECTION_COLLECTIONS_MONTH_STATUS_ICONS[cell.status];
  const cellIdx = cell.year * 12 + cell.month;
  const todayIdx = year * 12 + todayMonth;
  const isOverdue = cell.status === "due" && cellIdx < todayIdx;
  const expectedAmount = formatExpectedAmount(cell, locale, currency);
  const hasScholarshipDiscount = scholarshipDiscountPercent != null;
  const aria = [
    ariaPrefix,
    monthLabel,
    statusLabel(cell.status, labels),
    hasScholarshipDiscount ? `${scholarshipDiscountPercent}%` : null,
    expectedAmount ? `${labels.expectedAmount}: ${expectedAmount}` : null,
  ].filter(Boolean).join(" · ");

  const selectedRing = selected
    ? "ring-2 ring-[var(--color-primary)] ring-offset-1"
    : "";

  const handleClick = selectable && onToggle ? () => onToggle(cell.month) : undefined;
  const cursorClass = selectable ? "cursor-pointer" : "";

  return (
    <span className={`inline-flex ${sectionCollectionsMatrixChipHoverFrame}`}>
      <button
        type="button"
        aria-label={aria}
        aria-pressed={selected}
        title={aria}
        disabled={!selectable}
        onClick={handleClick}
        className={`inline-flex h-8 min-w-[34px] flex-col items-center justify-center rounded border text-[10px] font-semibold leading-none transition-shadow disabled:cursor-default ${sectionCollectionsMonthCellClasses(cell.status, isOverdue, hasScholarshipDiscount)} ${selectedRing} ${cursorClass}`}
      >
        {hasScholarshipDiscount ? (
          <>
            <span>{scholarshipDiscountPercent}%</span>
            <Icon className="mt-0.5 h-2.5 w-2.5" aria-hidden />
          </>
        ) : (
          <Icon className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    </span>
  );
}
