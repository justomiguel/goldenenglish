import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AdminAnalyticsEntry } from "@/components/dashboard/AdminAnalyticsEntry";
import type { TrafficGeoRow } from "@/components/dashboard/AdminAnalyticsGeoChoropleth";
import type { TrafficDailyRow, TrafficSummary } from "@/components/dashboard/AdminAnalyticsTrafficSection";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

type HourlyRow = { hour: number; role: string; cnt: number };
type GeoRow = { country: string; cnt: number };
type FunnelRow = { section: string; viewers: number };

type TrafficSummaryRow = {
  authenticated_hits: number | string;
  guest_hits: number | string;
  bot_hits: number | string;
  total_hits: number | string;
};

type TrafficDailyRaw = {
  day: string;
  authenticated_hits: number | string;
  guest_hits: number | string;
  bot_hits: number | string;
};

function toTrafficSummary(rows: unknown): TrafficSummary {
  const row = (Array.isArray(rows) ? rows[0] : null) as TrafficSummaryRow | null | undefined;
  return {
    authenticated_hits: Number(row?.authenticated_hits ?? 0),
    guest_hits: Number(row?.guest_hits ?? 0),
    bot_hits: Number(row?.bot_hits ?? 0),
    total_hits: Number(row?.total_hits ?? 0),
  };
}

function toTrafficDaily(rows: unknown): TrafficDailyRow[] {
  const list = (Array.isArray(rows) ? rows : []) as TrafficDailyRaw[];
  return list.map((r) => ({
    day: String(r.day),
    authenticated_hits: Number(r.authenticated_hits ?? 0),
    guest_hits: Number(r.guest_hits ?? 0),
    bot_hits: Number(r.bot_hits ?? 0),
  }));
}

type TrafficGeoRaw = { country: string; cnt: number | string };

function toTrafficGeoRows(rows: unknown): TrafficGeoRow[] {
  const list = (Array.isArray(rows) ? rows : []) as TrafficGeoRaw[];
  return list.map((r) => ({
    country: String(r.country),
    cnt: Number(r.cnt ?? 0),
  }));
}

export default async function AdminAnalyticsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();

  const days = 30;
  const { data: hourlyRaw } = await supabase.rpc("admin_analytics_hourly_by_role", {
    p_days: days,
  });
  const { data: geoRaw } = await supabase.rpc("admin_analytics_geo", { p_days: days });
  const { data: funnelRaw } = await supabase.rpc("admin_analytics_section_funnel", {
    p_days: 7,
  });
  const { data: trafficSummaryRaw } = await supabase.rpc("admin_traffic_summary", {
    p_days: days,
  });
  const { data: trafficDailyRaw } = await supabase.rpc("admin_traffic_daily_stacked", {
    p_days: days,
  });
  const { data: trafficGeoRaw } = await supabase.rpc("admin_traffic_geo_totals", {
    p_days: days,
  });

  const hourly = (hourlyRaw ?? []) as HourlyRow[];
  const geo = (geoRaw ?? []) as GeoRow[];
  const funnel = (funnelRaw ?? []) as FunnelRow[];
  const trafficSummary = toTrafficSummary(trafficSummaryRaw);
  const trafficDaily = toTrafficDaily(trafficDailyRaw);
  const trafficGeo = toTrafficGeoRows(trafficGeoRaw);

  return (
    <AdminAnalyticsEntry
      locale={locale}
      labels={dict.admin.analytics}
      trafficSummary={trafficSummary}
      trafficDaily={trafficDaily}
      trafficGeo={trafficGeo}
      hourly={hourly}
      geo={geo}
      funnel={funnel}
    />
  );
}
