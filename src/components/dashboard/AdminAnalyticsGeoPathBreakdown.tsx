"use client";

import type { Dictionary } from "@/types/i18n";

export type TrafficGeoPathRow = { country: string; pathname: string; cnt: number };

type Labels = Pick<
  Dictionary["admin"]["analytics"],
  | "trafficGeoPathTitle"
  | "trafficGeoPathHint"
  | "trafficGeoPathColCountry"
  | "trafficGeoPathColPath"
  | "trafficGeoPathColHits"
  | "trafficGeoPathEmpty"
>;

interface AdminAnalyticsGeoPathBreakdownProps {
  locale: string;
  labels: Labels;
  rows: TrafficGeoPathRow[];
}

export function AdminAnalyticsGeoPathBreakdown({ locale, labels, rows }: AdminAnalyticsGeoPathBreakdownProps) {
  const nf = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", { maximumFractionDigits: 0 });

  return (
    <section
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      aria-labelledby="admin-analytics-geo-path-title"
    >
      <h2
        id="admin-analytics-geo-path-title"
        className="font-semibold text-[var(--color-primary)]"
      >
        {labels.trafficGeoPathTitle}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.trafficGeoPathHint}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
              <th scope="col" className="py-2 pr-3 font-medium">
                {labels.trafficGeoPathColCountry}
              </th>
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
                <td colSpan={3} className="py-6 text-center text-[var(--color-muted-foreground)]">
                  {labels.trafficGeoPathEmpty}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.country}:${r.pathname}:${i}`} className="border-b border-[var(--color-border)]/60">
                  <td className="max-w-[6rem] truncate py-2 pr-3 font-mono text-xs" title={r.country}>
                    {r.country}
                  </td>
                  <td className="max-w-[min(32rem,85vw)] truncate py-2 pr-3 font-mono text-xs" title={r.pathname}>
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
