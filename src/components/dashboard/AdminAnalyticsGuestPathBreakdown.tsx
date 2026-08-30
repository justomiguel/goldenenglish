"use client";

import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
import type { Dictionary } from "@/types/i18n";

export type TrafficGuestPathRow = { pathname: string; cnt: number };

type Labels = Pick<
  Dictionary["admin"]["analytics"],
  | "trafficGuestPathTitle"
  | "trafficGuestPathHint"
  | "trafficGuestPathEmpty"
  | "trafficGeoPathColPath"
  | "trafficGeoPathColHits"
>;

interface AdminAnalyticsGuestPathBreakdownProps {
  locale: string;
  labels: Labels;
  rows: TrafficGuestPathRow[];
}

export function AdminAnalyticsGuestPathBreakdown({ locale, labels, rows }: AdminAnalyticsGuestPathBreakdownProps) {
  const nf = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", { maximumFractionDigits: 0 });
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

  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]"
      aria-labelledby="admin-analytics-guest-path-title"
    >
      <h2
        id="admin-analytics-guest-path-title"
        className="font-semibold text-[var(--color-primary)]"
      >
        {labels.trafficGuestPathTitle}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.trafficGuestPathHint}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
              <SortableTh columnId="path" label={labels.trafficGeoPathColPath} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="py-2 pr-3 font-medium" />
              <SortableTh columnId="hits" label={labels.trafficGeoPathColHits} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="py-2 text-end font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-6 text-center text-[var(--color-muted-foreground)]">
                  {labels.trafficGuestPathEmpty}
                </td>
              </tr>
            ) : (
              sortedRows.map((r, i) => (
                <tr key={`${r.pathname}:${i}`} className="border-b border-[var(--color-border)]/60">
                  <td className="max-w-[min(36rem,90vw)] truncate py-2 pr-3 font-mono text-xs" title={r.pathname}>
                    {r.pathname}
                  </td>
                  <td className="py-2 text-end tabular-nums">{nf.format(r.cnt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
