"use client";

import dynamic from "next/dynamic";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { Dictionary } from "@/types/i18n";
import {
  AdminAnalyticsTrafficSection,
  type TrafficDailyRow,
  type TrafficSummary,
} from "@/components/dashboard/AdminAnalyticsTrafficSection";
import type { TrafficGeoRow } from "@/components/dashboard/AdminAnalyticsGeoChoropleth";
import {
  AdminAnalyticsGeoPathBreakdown,
  type TrafficGeoPathRow,
} from "@/components/dashboard/AdminAnalyticsGeoPathBreakdown";
import {
  AdminAnalyticsGuestPathBreakdown,
  type TrafficGuestPathRow,
} from "@/components/dashboard/AdminAnalyticsGuestPathBreakdown";
import type { TrafficKindBreakdowns } from "@/components/dashboard/AdminAnalyticsTrafficBreakdownPanel";
import {
  AdminAnalyticsHourlyChart,
  type AdminAnalyticsHourlyRow,
} from "@/components/dashboard/AdminAnalyticsHourlyChart";
import {
  AdminAnalyticsFunnelGeoCharts,
  type AdminAnalyticsFunnelRow,
  type AdminAnalyticsGeoBarRow,
} from "@/components/dashboard/AdminAnalyticsFunnelGeoCharts";

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
  trafficGeoPath: TrafficGeoPathRow[];
  trafficGuestPath: TrafficGuestPathRow[];
  trafficBreakdowns: TrafficKindBreakdowns;
  hourly: AdminAnalyticsHourlyRow[];
  geo: AdminAnalyticsGeoBarRow[];
  funnel: AdminAnalyticsFunnelRow[];
}

export function AdminAnalyticsCharts({
  locale,
  labels,
  trafficSummary,
  trafficDaily,
  trafficGeo,
  trafficGeoPath,
  trafficGuestPath,
  trafficBreakdowns,
  hourly,
  geo,
  funnel,
}: AdminAnalyticsChartsProps) {
  const reducedMotion = usePrefersReducedMotion();
  const animate = !reducedMotion;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>

      <AdminAnalyticsTrafficSection
        locale={locale}
        labels={labels}
        summary={trafficSummary}
        daily={trafficDaily}
        breakdowns={trafficBreakdowns}
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
              worldMapNoCountryData: labels.worldMapNoCountryData,
              trafficTopCountries: labels.trafficTopCountries,
              worldMapTooltipVisits: labels.worldMapTooltipVisits,
              worldMapTooltipNoVisits: labels.worldMapTooltipNoVisits,
              worldMapUnknownRegion: labels.worldMapUnknownRegion,
            }}
            rows={trafficGeo}
          />
        </div>
      </section>

      <AdminAnalyticsGeoPathBreakdown
        locale={locale}
        labels={{
          trafficGeoPathTitle: labels.trafficGeoPathTitle,
          trafficGeoPathHint: labels.trafficGeoPathHint,
          trafficGeoPathColCountry: labels.trafficGeoPathColCountry,
          trafficGeoPathColPath: labels.trafficGeoPathColPath,
          trafficGeoPathColHits: labels.trafficGeoPathColHits,
          trafficGeoPathEmpty: labels.trafficGeoPathEmpty,
        }}
        rows={trafficGeoPath}
      />

      <AdminAnalyticsGuestPathBreakdown
        locale={locale}
        labels={{
          trafficGuestPathTitle: labels.trafficGuestPathTitle,
          trafficGuestPathHint: labels.trafficGuestPathHint,
          trafficGuestPathEmpty: labels.trafficGuestPathEmpty,
          trafficGeoPathColPath: labels.trafficGeoPathColPath,
          trafficGeoPathColHits: labels.trafficGeoPathColHits,
        }}
        rows={trafficGuestPath}
      />

      <AdminAnalyticsHourlyChart rows={hourly} animate={animate} labels={labels} />
      <AdminAnalyticsFunnelGeoCharts funnel={funnel} geo={geo} animate={animate} labels={labels} />
    </div>
  );
}
