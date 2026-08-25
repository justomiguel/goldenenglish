"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { AdminTrafficVisitsPoint } from "@/lib/dashboard/mapAdminTrafficDailyStacked";
import {
  formatTrafficChartDay,
  trafficChartReference,
} from "@/lib/dashboard/trafficChartReference";

export function AdminHubTrafficChart({
  series,
  visitsLabel,
  locale,
}: {
  series: AdminTrafficVisitsPoint[];
  visitsLabel: string;
  locale: string;
}) {
  const animate = !usePrefersReducedMotion();
  const visits = series.map((p) => p.visits).join(",");
  const ref = trafficChartReference(series);
  const startLabel = ref.firstDay ? formatTrafficChartDay(ref.firstDay, locale) : "";
  const endLabel = ref.lastDay ? formatTrafficChartDay(ref.lastDay, locale) : "";
  const rangeText =
    series.length === 0 ? "" : `${startLabel} – ${endLabel} · ${visitsLabel} 0–${ref.max.toLocaleString(locale)}`;

  return (
    <div data-hub-traffic-visits={visits}>
      {series.length === 0 ? (
        <div className="h-16" aria-hidden />
      ) : (
        <>
          <RechartsSizedFrame height={80} className="w-full min-w-0">
            {(w, h) => (
              <ResponsiveContainer width={w} height={h} minWidth={0}>
                <AreaChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 2 }}>
                  <defs>
                    <linearGradient id="admin-hub-traffic-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(day) => formatTrafficChartDay(String(day), locale)}
                    interval="preserveStartEnd"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={40}
                    height={16}
                  />
                  <YAxis
                    width={28}
                    tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, "auto"]}
                    tickCount={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name={visitsLabel}
                    stroke="#7c3aed"
                    fill="url(#admin-hub-traffic-fill)"
                    strokeWidth={2.5}
                    isAnimationActive={animate}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </RechartsSizedFrame>
          <p className="mt-2 text-[0.7rem] leading-4 text-[var(--color-muted-foreground)]">{rangeText}</p>
        </>
      )}
    </div>
  );
}
