"use client";

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

  return (
    <section
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
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
              <th scope="col" className="py-2 pr-3 font-medium">
                {labels.trafficGeoPathColPath}
              </th>
              <th scope="col" className="py-2 text-end font-medium">
                {labels.trafficGeoPathColHits}
              </th>
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
              rows.map((r, i) => (
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
