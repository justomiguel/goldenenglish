"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import type { Dictionary } from "@/types/i18n";

export type AdminAnalyticsFunnelRow = { section: string; viewers: number };
export type AdminAnalyticsGeoBarRow = { country: string; cnt: number };

interface AdminAnalyticsFunnelGeoChartsProps {
  funnel: AdminAnalyticsFunnelRow[];
  geo: AdminAnalyticsGeoBarRow[];
  animate: boolean;
  labels: Pick<
    Dictionary["admin"]["analytics"],
    "chartFunnel" | "chartFunnelHint" | "chartGeo" | "chartGeoHint" | "viewers" | "events"
  >;
}

export function AdminAnalyticsFunnelGeoCharts({
  funnel,
  geo,
  animate,
  labels,
}: AdminAnalyticsFunnelGeoChartsProps) {
  return (
    <>
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold text-[var(--color-primary)]">{labels.chartFunnel}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.chartFunnelHint}</p>
        <RechartsSizedFrame height={288} className="mt-4 w-full min-w-0">
          {(w, h) => (
            <ResponsiveContainer width={w} height={h} minWidth={0}>
              <BarChart
                data={funnel.map((f) => ({ name: f.section, viewers: Number(f.viewers) }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar
                  isAnimationActive={animate}
                  dataKey="viewers"
                  fill="var(--color-primary)"
                  name={labels.viewers}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </RechartsSizedFrame>
      </section>

      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold text-[var(--color-primary)]">{labels.chartGeo}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.chartGeoHint}</p>
        <RechartsSizedFrame height={288} className="mt-4 w-full min-w-0">
          {(w, h) => (
            <ResponsiveContainer width={w} height={h} minWidth={0}>
              <BarChart data={geo.map((g) => ({ country: g.country, cnt: Number(g.cnt) }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  isAnimationActive={animate}
                  dataKey="cnt"
                  fill="var(--color-secondary)"
                  name={labels.events}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </RechartsSizedFrame>
      </section>
    </>
  );
}
