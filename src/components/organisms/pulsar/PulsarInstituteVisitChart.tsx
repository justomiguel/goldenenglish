"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatTrafficChartDay } from "@/lib/dashboard/trafficChartReference";
import type { VisitDayPoint } from "@/lib/pulsar/visitDaySeries";

export interface PulsarInstituteVisitChartProps {
  locale: string;
  series: readonly VisitDayPoint[] | null;
  title: string;
  emptyLabel: string;
  visitsLabel: string;
}

export function PulsarInstituteVisitChart({
  locale,
  series,
  title,
  emptyLabel,
  visitsLabel,
}: PulsarInstituteVisitChartProps) {
  const animate = !usePrefersReducedMotion();
  return (
    <section aria-label={title}>
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2>
      {series == null ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{emptyLabel}</p>
      ) : (
        <RechartsSizedFrame height={220} className="mt-3 w-full min-w-0">
          {(width, height) => (
            <ResponsiveContainer width={width} height={height} minWidth={0}>
              <AreaChart data={[...series]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(day) => formatTrafficChartDay(String(day), locale)}
                  interval="preserveStartEnd"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={32}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [Number(value).toLocaleString(locale), visitsLabel]}
                  labelFormatter={(day) => formatTrafficChartDay(String(day), locale)}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name={visitsLabel}
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.16}
                  strokeWidth={2}
                  isAnimationActive={animate}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </RechartsSizedFrame>
      )}
    </section>
  );
}
