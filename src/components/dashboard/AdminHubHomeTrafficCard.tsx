"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import { AdminHubMetricCard } from "@/components/dashboard/AdminHubMetricCard";
import { AdminHubTrafficChart } from "@/components/dashboard/AdminHubTrafficChart";
import { trafficVisitsSeries } from "@/lib/dashboard/mapAdminTrafficDailyStacked";

const metricIcon =
  "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]";

export function AdminHubHomeTrafficCard({
  locale,
  base,
  dict,
  summary,
}: {
  locale: string;
  base: string;
  dict: Dictionary;
  summary: AdminHubSummary;
}) {
  const t = dict.admin.home.summary;
  const weekDelta =
    summary.trafficWeekOverWeek.lastWeek > 0
      ? Math.round(
          ((summary.trafficWeekOverWeek.thisWeek - summary.trafficWeekOverWeek.lastWeek) /
            summary.trafficWeekOverWeek.lastWeek) *
            100,
        )
      : 0;
  const trendLabel =
    weekDelta > 0
      ? `${weekDelta}% ${t.traffic.up}`
      : weekDelta < 0
        ? `${Math.abs(weekDelta)}% ${t.traffic.down}`
        : t.traffic.flat;
  const TrendIcon = weekDelta > 0 ? ArrowUpRight : weekDelta < 0 ? ArrowDownRight : Minus;
  const trendColor =
    weekDelta > 0
      ? "text-emerald-600"
      : weekDelta < 0
        ? "text-rose-500"
        : "text-[var(--color-muted-foreground)]";

  return (
    <AdminHubMetricCard
      href={`${base}/analytics`}
      tourAnchor="admin-hub-traffic"
      icon={<Activity className="h-6 w-6" />}
      title={t.traffic.title}
      accentClass={metricIcon}
      hint={t.traffic.cardTip}
      rangeLabel={t.traffic.hits30d}
      className="shrink-0 p-6"
    >
      <div className="space-y-4">
        <AdminHubTrafficChart
          series={trafficVisitsSeries(summary.trafficDaily)}
          visitsLabel={t.traffic.hits30d}
          locale={locale}
        />
        <div>
          <p className="text-4xl font-bold tracking-tight text-[var(--color-foreground)]">
            {summary.traffic.totalHits.toLocaleString()}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-[var(--color-muted-foreground)]">
            <span>
              <span className="font-semibold text-[var(--color-foreground)]">
                {summary.traffic.authenticatedHits.toLocaleString()}
              </span>{" "}
              {t.traffic.authenticated}
            </span>
            <span>
              <span className="font-semibold text-[var(--color-foreground)]">
                {summary.traffic.guestHits.toLocaleString()}
              </span>{" "}
              {t.traffic.guests}
            </span>
          </div>
          <div className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${trendColor}`}>
            <TrendIcon className="h-4 w-4" aria-hidden />
            <span>
              {trendLabel} {t.traffic.weekTrend}
            </span>
          </div>
        </div>
      </div>
    </AdminHubMetricCard>
  );
}
