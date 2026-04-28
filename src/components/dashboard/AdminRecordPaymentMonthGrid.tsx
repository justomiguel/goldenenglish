"use client";

import { CheckSquare, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { AdminBillingMatrixLegendModal } from "@/components/dashboard/AdminBillingMatrixLegendModal";
import { AdminRecordPaymentMonthlyMatrixCells } from "@/components/dashboard/AdminRecordPaymentMonthlyMatrixCells";
import {
  EnrollmentMonthZeroColumn,
  type EnrollmentMonthZeroColumnLabels,
} from "@/components/dashboard/EnrollmentMonthZeroColumn";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";
import type { Locale } from "@/types/i18n";

export interface AdminRecordPaymentMonthGridProps {
  locale: Locale;
  /** Year shown in the matrix (overdue is computed vs “today” in the browser). */
  viewYear: number;
  selectedMonths: ReadonlySet<number>;
  monthStates: AdminBillingMonthState[];
  collectionCells?: StudentMonthlyPaymentCell[] | null;
  onToggle: (month: number, next: boolean) => void;
  onSelectAll: () => void;
  onClear: () => void;
  labels: {
    selectAll: string;
    clear: string;
    countSelected: string;
    gridHint: string;
    matrixLegend: string;
    matrixLegendOpenButton: string;
    matrixLegendModalTitle: string;
    cancelLabel: string;
    matrixLegendScholarshipSample: string;
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
    monthZeroColumnShort: string;
    monthZeroTooltip: string;
  };
  disabled: boolean;
  /** Enrollment fee column; omit when section has no matrícula. */
  enrollmentMonthZero: {
    visual: {
      status: StudentMonthlyPaymentCell["status"];
      isOverdue: boolean;
    } | null;
    ariaLabel: string;
    labels: EnrollmentMonthZeroColumnLabels;
    onActivate?: () => void;
    disabled?: boolean;
  } | null;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function AdminRecordPaymentMonthGrid({
  locale,
  viewYear,
  selectedMonths,
  monthStates,
  collectionCells = null,
  onToggle,
  onSelectAll,
  onClear,
  labels,
  disabled,
  enrollmentMonthZero,
}: AdminRecordPaymentMonthGridProps) {
  const gridHintId = useId();
  const [today] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const monthShort = useMemo(
    () =>
      MONTHS.map((m) =>
        new Intl.DateTimeFormat(locale, { month: "short" }).format(
          new Date(Date.UTC(2000, m - 1, 1)),
        ),
      ),
    [locale],
  );
  const n = selectedMonths.size;
  const legendModalLabels = useMemo(
    () => ({
      openButton: labels.matrixLegendOpenButton,
      modalTitle: labels.matrixLegendModalTitle,
      matrixLegend: labels.matrixLegend,
      cancelLabel: labels.cancelLabel,
      statusPaid: labels.statusPaid,
      statusPending: labels.statusPending,
      statusRejected: labels.statusRejected,
      statusExempt: labels.statusExempt,
      statusUnpaid: labels.statusUnpaid,
      statusOverdue: labels.statusOverdue,
      statusNoPlan: labels.statusNoPlan,
      statusOutOfPeriod: labels.statusOutOfPeriod,
      matrixLegendScholarshipSample: labels.matrixLegendScholarshipSample,
    }),
    [labels],
  );

  const monthlyLabels = useMemo(
    () => ({
      statusPaid: labels.statusPaid,
      statusPending: labels.statusPending,
      statusRejected: labels.statusRejected,
      statusExempt: labels.statusExempt,
      statusUnpaid: labels.statusUnpaid,
      statusOverdue: labels.statusOverdue,
      statusNoPlan: labels.statusNoPlan,
      statusOutOfPeriod: labels.statusOutOfPeriod,
      scholarship: labels.scholarship,
      legacy: labels.legacy,
    }),
    [labels],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={onSelectAll}
            className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/30 disabled:opacity-50"
          >
            <CheckSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {labels.selectAll}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/30 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {labels.clear}
          </button>
          <span className="text-sm text-[var(--color-muted-foreground)]">
            {labels.countSelected.replace("{count}", String(n))}
          </span>
        </div>
        <AdminBillingMatrixLegendModal labels={legendModalLabels} />
      </div>
      <div
        className="overflow-x-auto pb-1"
        role="group"
        aria-describedby={gridHintId}
      >
        <div className="flex min-w-[min(100%,520px)] gap-1" dir="ltr">
          {enrollmentMonthZero ? (
            <EnrollmentMonthZeroColumn
              visual={enrollmentMonthZero.visual}
              ariaLabel={enrollmentMonthZero.ariaLabel}
              labels={enrollmentMonthZero.labels}
              onActivate={enrollmentMonthZero.onActivate}
              disabled={enrollmentMonthZero.disabled}
            />
          ) : null}
          <AdminRecordPaymentMonthlyMatrixCells
            viewYear={viewYear}
            todayYear={today.year}
            todayMonth={today.month}
            monthShort={monthShort}
            monthStates={monthStates}
            collectionCells={collectionCells}
            selectedMonths={selectedMonths}
            onToggle={onToggle}
            labels={monthlyLabels}
            disabled={disabled}
          />
        </div>
      </div>
      <p
        id={gridHintId}
        className="max-w-[52rem] text-sm leading-snug text-[var(--color-muted-foreground)]"
      >
        {labels.gridHint}
      </p>
    </div>
  );
}
