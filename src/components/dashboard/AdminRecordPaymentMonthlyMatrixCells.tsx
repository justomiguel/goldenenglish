"use client";

import { resolveAdminBillingMonthChipVisual } from "@/lib/billing/adminBillingMonthCollectionVisual";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import { sectionCollectionsMonthCellClasses } from "@/lib/billing/sectionCollectionsMonthCellClasses";
import { SECTION_COLLECTIONS_MONTH_STATUS_ICONS } from "@/lib/billing/sectionCollectionsMonthStatusIcons";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export interface AdminRecordPaymentMonthlyMatrixCellsLabels {
  statusPaid: string;
  statusPending: string;
  statusRejected: string;
  statusExempt: string;
  statusUnpaid: string;
  statusOverdue: string;
  statusNoPlan: string;
  statusOutOfPeriod: string;
  scholarship: string;
  legacy: string;
}

export interface AdminRecordPaymentMonthlyMatrixCellsProps {
  viewYear: number;
  todayYear: number;
  todayMonth: number;
  monthShort: readonly string[];
  monthStates: AdminBillingMonthState[];
  collectionCells?: StudentMonthlyPaymentCell[] | null;
  selectedMonths: ReadonlySet<number>;
  onToggle: (month: number, next: boolean) => void;
  labels: AdminRecordPaymentMonthlyMatrixCellsLabels;
  disabled: boolean;
}

export function AdminRecordPaymentMonthlyMatrixCells({
  viewYear,
  todayYear,
  todayMonth,
  monthShort,
  monthStates,
  collectionCells = null,
  selectedMonths,
  onToggle,
  labels,
  disabled,
}: AdminRecordPaymentMonthlyMatrixCellsProps) {
  const stateByMonth = new Map(monthStates.map((s) => [s.month, s]));

  return (
    <>
      {MONTHS.map((m) => {
        const on = selectedMonths.has(m);
        const state = stateByMonth.get(m) ?? {
          month: m,
          status: "unpaid" as const,
          paymentId: null,
          recordedAmount: null,
          scholarshipPercent: null,
          selectable: true,
          legacyFallback: false,
        };
        const coll = collectionCells?.[m - 1];
        const vis = resolveAdminBillingMonthChipVisual(state, coll, viewYear, todayYear, todayMonth);
        const cellClass = sectionCollectionsMonthCellClasses(
          vis.status,
          vis.isOverdue,
          vis.hasScholarshipDiscount,
        );
        const statusText = monthGridStatusLine(state, vis, labels);
        const Icon = SECTION_COLLECTIONS_MONTH_STATUS_ICONS[vis.status];
        const disabledMonth = disabled || !state.selectable;
        const scholarshipPct =
          vis.hasScholarshipDiscount && coll?.scholarshipDiscountPercent != null
            ? coll.scholarshipDiscountPercent
            : state.scholarshipPercent;
        const aria = [
          monthShort[m - 1] ?? `M${m}`,
          statusText,
          scholarshipPct == null
            ? null
            : labels.scholarship.replace("{percent}", String(scholarshipPct)),
          state.legacyFallback ? labels.legacy : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <div
            key={m}
            className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-0.5"
          >
            <span className="w-full truncate text-center text-[10px] font-medium text-[var(--color-muted-foreground)]">
              {monthShort[m - 1]}
            </span>
            <button
              type="button"
              disabled={disabledMonth}
              onClick={() => onToggle(m, !on)}
              className={[
                "box-border inline-flex h-8 w-full min-w-[34px] max-w-[52px] flex-col items-center justify-center rounded border text-[10px] font-semibold leading-none transition",
                cellClass,
                on
                  ? "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-surface)]"
                  : "",
                disabledMonth
                  ? "cursor-not-allowed disabled:cursor-not-allowed disabled:opacity-100"
                  : "cursor-pointer",
              ].join(" ")}
              aria-pressed={on}
              aria-label={aria}
              title={aria}
            >
              {vis.hasScholarshipDiscount && scholarshipPct != null ? (
                <>
                  <span className="leading-none">
                    {String(scholarshipPct).replace(/\.0+$/, "")}%
                  </span>
                  <Icon className="mt-0.5 h-2.5 w-2.5" aria-hidden />
                </>
              ) : (
                <Icon className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
            <span
              className="w-full break-words text-center text-[9px] leading-tight text-[var(--color-muted-foreground)]"
              aria-hidden
            >
              {statusText}
            </span>
          </div>
        );
      })}
    </>
  );
}

function monthGridStatusLine(
  state: AdminBillingMonthState,
  vis: { status: StudentMonthlyPaymentCell["status"]; isOverdue: boolean },
  labels: AdminRecordPaymentMonthlyMatrixCellsLabels,
): string {
  if (state.legacyFallback) {
    return labels.legacy;
  }
  if (vis.status === "no-plan") {
    return labels.statusNoPlan;
  }
  if (vis.status === "out-of-period") {
    return labels.statusOutOfPeriod;
  }
  if (vis.status === "due" && vis.isOverdue) {
    return labels.statusOverdue;
  }
  switch (state.status) {
    case "paid":
      return labels.statusPaid;
    case "pending":
      return labels.statusPending;
    case "rejected":
      return labels.statusRejected;
    case "exempt":
      return labels.statusExempt;
    case "unpaid":
      return labels.statusUnpaid;
  }
}
