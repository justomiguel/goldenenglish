"use client";

import { AlertTriangle } from "lucide-react";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
import type { Dictionary } from "@/types/i18n";
import type { TrafficVisitorKind } from "@/lib/dashboard/loadAdminTrafficKindBreakdowns";
import { isProtectedTrafficPath } from "@/lib/analytics/protectedTrafficPath";

interface TrafficBreakdownPathsTableProps {
  locale?: string;
  labels: Dictionary["admin"]["analytics"];
  kind: TrafficVisitorKind;
  rows: { pathname: string; cnt: number }[];
  nf: Intl.NumberFormat;
}

/**
 * Top URLs panel with a contextual badge for paths that should require auth.
 * Only the **guest** tab shows the warning column — for `authenticated` and
 * `bot` traffic, hits on protected URLs are expected.
 */
export function TrafficBreakdownPathsTable({
  locale = "es",
  labels,
  kind,
  rows,
  nf,
}: TrafficBreakdownPathsTableProps) {
  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    rows,
    {
      path: (r) => r.pathname,
      hits: (r) => r.cnt,
    },
    "hits",
    "desc",
  );
  const showGuestWarning = kind === "guest";
  const protectedCount = showGuestWarning
    ? rows.filter((r) => isProtectedTrafficPath(r.pathname)).length
    : 0;

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-sm font-semibold text-[var(--color-primary)]">
        {labels.trafficBreakdownPathsTitle}
      </p>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {labels.trafficBreakdownPathsHint}
      </p>
      {showGuestWarning && protectedCount > 0 ? (
        <p
          className="mt-2 flex items-start gap-2 rounded-md border border-[var(--color-warning,_#b45309)]/40 bg-[var(--color-warning,_#fef3c7)]/40 p-2 text-xs text-[var(--color-foreground)]"
          role="note"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning,_#b45309)]" aria-hidden />
          <span>{labels.trafficBreakdownGuestProtectedNotice}</span>
        </p>
      ) : null}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
              <SortableTh columnId="path" label={labels.trafficBreakdownColPath} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="py-1.5 pr-3 font-medium" />
              <SortableTh columnId="hits" label={labels.trafficBreakdownColHits} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="py-1.5 text-end font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-6 text-center text-[var(--color-muted-foreground)]">
                  {labels.trafficBreakdownPathsEmpty}
                </td>
              </tr>
            ) : (
              sortedRows.map((r, i) => {
                const protectedPath = showGuestWarning && isProtectedTrafficPath(r.pathname);
                return (
                  <tr
                    key={`${r.pathname}:${i}`}
                    className="border-b border-[var(--color-border)]/60"
                  >
                    <td className="py-1.5 pr-3" title={r.pathname}>
                      <span className="flex min-w-0 items-center gap-2">
                        {protectedPath ? (
                          <AlertTriangle
                            className="h-3.5 w-3.5 shrink-0 text-[var(--color-warning,_#b45309)]"
                            aria-label={labels.trafficBreakdownGuestProtectedRowAria}
                          />
                        ) : null}
                        <span className="truncate font-mono text-xs">{r.pathname || "—"}</span>
                      </span>
                    </td>
                    <td className="py-1.5 text-end tabular-nums">{nf.format(r.cnt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
