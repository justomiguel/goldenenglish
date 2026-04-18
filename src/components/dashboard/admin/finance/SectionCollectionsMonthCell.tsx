import { Check, CircleDot, Clock, FileText, Lock, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

const STATUS_ICON: Record<StudentMonthlyPaymentCell["status"], LucideIcon> = {
  approved: Check,
  pending: Clock,
  rejected: X,
  exempt: FileText,
  due: CircleDot,
  "out-of-period": Lock,
  "no-plan": Lock,
};

function classesFor(
  status: StudentMonthlyPaymentCell["status"],
  isOverdue: boolean,
): string {
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

export interface SectionCollectionsMonthCellProps {
  cell: StudentMonthlyPaymentCell;
  monthLabel: string;
  todayMonth: number;
  year: number;
  ariaPrefix: string;
}

export function SectionCollectionsMonthCell({
  cell,
  monthLabel,
  todayMonth,
  year,
  ariaPrefix,
}: SectionCollectionsMonthCellProps) {
  const Icon = STATUS_ICON[cell.status];
  const cellIdx = cell.year * 12 + cell.month;
  const todayIdx = year * 12 + todayMonth;
  const isOverdue = cell.status === "due" && cellIdx < todayIdx;
  const aria = `${ariaPrefix} · ${monthLabel}`;
  return (
    <span
      aria-label={aria}
      title={aria}
      className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded border ${classesFor(cell.status, isOverdue)}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}
