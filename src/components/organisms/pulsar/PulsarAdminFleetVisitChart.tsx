"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface PulsarAdminFleetVisitChartProps {
  locale: string;
  title: string;
  visitsLabel: string;
  rows: readonly { name: string; visits: number }[];
}

export function PulsarAdminFleetVisitChart({
  locale,
  title,
  visitsLabel,
  rows,
}: PulsarAdminFleetVisitChartProps) {
  const animate = !usePrefersReducedMotion();
  return (
    <section aria-label={title} className="mt-8">
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2>
      <RechartsSizedFrame height={220} className="mt-3 w-full min-w-0">
        {(width, height) => (
          <ResponsiveContainer width={width} height={height} minWidth={0}>
            <BarChart data={[...rows]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                interval={0}
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
              <Tooltip formatter={(value) => [Number(value).toLocaleString(locale), visitsLabel]} />
              <Bar
                dataKey="visits"
                name={visitsLabel}
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={animate}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </RechartsSizedFrame>
    </section>
  );
}
