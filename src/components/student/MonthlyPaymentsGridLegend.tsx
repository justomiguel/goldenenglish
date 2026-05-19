import type { Dictionary } from "@/types/i18n";

type GridLegend = Dictionary["dashboard"]["student"]["paymentsPwa"]["legend"];

export interface MonthlyPaymentsGridLegendProps {
  gridLegendLabels: GridLegend;
  hideNonBillableMonths: boolean;
}

export function MonthlyPaymentsGridLegend({
  gridLegendLabels,
  hideNonBillableMonths,
}: MonthlyPaymentsGridLegendProps) {
  return (
    <ul
      className="flex flex-wrap gap-3 text-xs text-[var(--color-muted-foreground)]"
      aria-label={gridLegendLabels.aria}
    >
      <li className="inline-flex items-center gap-1">
        <span
          className="h-3 w-3 rounded border-2 border-[var(--color-warning)] bg-[var(--color-warning)]/15"
          aria-hidden
        />
        {gridLegendLabels.due}
      </li>
      {!hideNonBillableMonths ? (
        <li className="inline-flex items-center gap-1">
          <span
            className="h-3 w-3 rounded border border-[var(--color-border)] bg-[var(--color-muted)]"
            aria-hidden
          />
          {gridLegendLabels.disabled}
        </li>
      ) : null}
      <li className="inline-flex items-center gap-1">
        <span
          className="h-3 w-3 rounded border border-[var(--color-success)] bg-[var(--color-success)]/15"
          aria-hidden
        />
        {gridLegendLabels.paid}
      </li>
      <li className="inline-flex items-center gap-1">
        <span
          className="h-3 w-3 rounded border border-[var(--color-warning)] bg-[var(--color-warning)]/20"
          aria-hidden
        />
        {gridLegendLabels.pending}
      </li>
    </ul>
  );
}
