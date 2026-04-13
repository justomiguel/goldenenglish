"use client";

import dynamic from "next/dynamic";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { Dictionary } from "@/types/i18n";
import {
  AdminAnalyticsTrafficSection,
  type TrafficDailyRow,
  type TrafficSummary,
} from "@/components/dashboard/AdminAnalyticsTrafficSection";
import type { TrafficGeoRow } from "@/components/dashboard/AdminAnalyticsGeoChoropleth";

type HourlyRow = { hour: number; role: string; cnt: number };
type GeoRow = { country: string; cnt: number };
type FunnelRow = { section: string; viewers: number };

const AdminAnalyticsGeoChoropleth = dynamic(
  () =>
    import("@/components/dashboard/AdminAnalyticsGeoChoropleth").then((m) => ({
      default: m.AdminAnalyticsGeoChoropleth,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(440px,70vw)] min-h-[280px] w-full animate-pulse rounded-md bg-[var(--color-muted)]"
        aria-busy
      />
    ),
  },
);

interface AdminAnalyticsChartsProps {
  locale: string;
  labels: Dictionary["admin"]["analytics"];
  trafficSummary: TrafficSummary;
  trafficDaily: TrafficDailyRow[];
  trafficGeo: TrafficGeoRow[];
  hourly: HourlyRow[];
  geo: GeoRow[];
  funnel: FunnelRow[];
}

const ROLE_KEYS = ["student", "parent", "teacher", "admin"] as const;

function pivotHourly(rows: HourlyRow[]) {
  const byHour = new Map<number, Record<string, number>>();
  for (const r of rows) {
    const h = r.hour;
    const cur = byHour.get(h) ?? { hour: h };
    cur[r.role] = Number(r.cnt);
    byHour.set(h, cur);
  }
  return Array.from({ length: 24 }, (_, hour) => {
    const base = byHour.get(hour) ?? { hour };
    const row: Record<string, number> = { hour };
    for (const k of ROLE_KEYS) {
      row[k] = Number(base[k] ?? 0);
    }
    return row;
  });
}

export function AdminAnalyticsCharts({
  locale,
  labels,
  trafficSummary,
  trafficDaily,
  trafficGeo,
  hourly,
  geo,
  funnel,
}: AdminAnalyticsChartsProps) {
  const reducedMotion = usePrefersReducedMotion();
  const animate = !reducedMotion;
  const heatData = pivotHourly(hourly);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>

      <AdminAnalyticsTrafficSection
        labels={labels}
        summary={trafficSummary}
        daily={trafficDaily}
      />

      <section
        className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        aria-labelledby="admin-analytics-world-map-title"
      >
        <h2
          id="admin-analytics-world-map-title"
          className="font-semibold text-[var(--color-primary)]"
        >
          {labels.chartWorldMap}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.chartWorldMapHint}</p>
        <div className="mt-4">
          <AdminAnalyticsGeoChoropleth
            locale={locale}
            labels={{
              chartWorldMapLegend: labels.chartWorldMapLegend,
              worldMapLoading: labels.worldMapLoading,
              worldMapError: labels.worldMapError,
              trafficTopCountries: labels.trafficTopCountries,
              worldMapTooltipVisits: labels.worldMapTooltipVisits,
              worldMapTooltipNoVisits: labels.worldMapTooltipNoVisits,
              worldMapUnknownRegion: labels.worldMapUnknownRegion,
            }}
            rows={trafficGeo}
          />
        </div>
      </section>

      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold text-[var(--color-primary)]">{labels.chartHourly}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.chartHourlyHint}</p>
        <RechartsSizedFrame height={320} className="mt-4 w-full min-w-0">
          {(w, h) => (
            <ResponsiveContainer width={w} height={h} minWidth={0}>
              <BarChart data={heatData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar
                  isAnimationActive={animate}
                  dataKey="student"
                  stackId="a"
                  fill="var(--color-primary)"
                  name={labels.roleStudent}
                />
                <Bar
                  isAnimationActive={animate}
                  dataKey="parent"
                  stackId="a"
                  fill="var(--color-accent)"
                  name={labels.roleParent}
                />
                <Bar
                  isAnimationActive={animate}
                  dataKey="teacher"
                  stackId="a"
                  fill="var(--color-secondary)"
                  name={labels.roleTeacher}
                />
                <Bar
                  isAnimationActive={animate}
                  dataKey="admin"
                  stackId="a"
                  fill="var(--color-muted-foreground)"
                  name={labels.roleAdmin}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </RechartsSizedFrame>
      </section>

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
    </div>
  );
}
