"use client";

import dynamic from "next/dynamic";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";

import type { TrafficGeoRow } from "@/components/dashboard/AdminAnalyticsGeoChoropleth";
import type { TrafficDailyRow, TrafficSummary } from "@/components/dashboard/AdminAnalyticsTrafficSection";

type HourlyRow = { hour: number; role: string; cnt: number };
type GeoRow = { country: string; cnt: number };
type FunnelRow = { section: string; viewers: number };

interface AdminAnalyticsEntryProps {
  locale: string;
  labels: Dictionary["admin"]["analytics"];
  trafficSummary: TrafficSummary;
  trafficDaily: TrafficDailyRow[];
  trafficGeo: TrafficGeoRow[];
  hourly: HourlyRow[];
  geo: GeoRow[];
  funnel: FunnelRow[];
}

const AdminAnalyticsCharts = dynamic(
  () =>
    import("@/components/dashboard/AdminAnalyticsCharts").then((m) => ({
      default: m.AdminAnalyticsCharts,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-8" aria-busy="true" aria-live="polite">
        <div className="animate-pulse space-y-4">
          <div className="h-8 max-w-xs rounded bg-[var(--color-muted)]" />
          <div className="h-64 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
          <div className="h-56 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
          <div className="h-80 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
          <div className="h-72 rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
        </div>
      </div>
    ),
  },
);

export function AdminAnalyticsEntry({
  locale,
  labels,
  trafficSummary,
  trafficDaily,
  trafficGeo,
  hourly,
  geo,
  funnel,
}: AdminAnalyticsEntryProps) {
  const body = (
    <AdminAnalyticsCharts
      locale={locale}
      labels={labels}
      trafficSummary={trafficSummary}
      trafficDaily={trafficDaily}
      trafficGeo={trafficGeo}
      hourly={hourly}
      geo={geo}
      funnel={funnel}
    />
  );

  return (
    <SurfaceMountGate
      skeleton={
        <div className="animate-pulse space-y-4" aria-hidden>
          <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
        </div>
      }
      desktop={<div className="mx-auto max-w-5xl space-y-6">{body}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{body}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
