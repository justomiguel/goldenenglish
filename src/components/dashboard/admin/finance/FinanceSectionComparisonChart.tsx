"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import type { FinanceSectionRanked } from "@/types/financeAnalytics";
import type { Dictionary } from "@/types/i18n";

type CompDict = Dictionary["admin"]["finance"]["insights"]["comparison"];

export interface FinanceSectionComparisonChartProps {
  ranked: FinanceSectionRanked[];
  locale: string;
  labels: CompDict;
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: "var(--color-primary)",
  watch: "var(--color-accent)",
  critical: "var(--color-error)",
};

export function FinanceSectionComparisonChart({
  ranked,
  locale,
  labels,
}: FinanceSectionComparisonChartProps) {
  if (ranked.length === 0) return null;

  const avgRatio =
    ranked.reduce((s, r) => s + r.collectionRatio, 0) / ranked.length;

  const data = ranked.map((r) => ({
    name: r.sectionName,
    ratio: Math.round(r.collectionRatio * 100),
    fill: HEALTH_COLORS[r.health] ?? "var(--color-muted-foreground)",
  }));

  const chartHeight = Math.max(200, ranked.length * 40 + 60);

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="font-semibold text-[var(--color-primary)]">
        {labels.title}
      </h3>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.hint}
      </p>
      <RechartsSizedFrame height={chartHeight} className="mt-4 w-full min-w-0">
        {(w, h) => (
          <ResponsiveContainer width={w} height={h} minWidth={0}>
            <BarChart data={data} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => {
                  const v =
                    typeof value === "number"
                      ? value
                      : typeof value === "string"
                        ? Number(value)
                        : NaN;
                  if (!Number.isFinite(v))
                    return [
                      "",
                      Intl.NumberFormat(locale, { style: "percent" }).format(0),
                    ];
                  return [
                    `${v}%`,
                    Intl.NumberFormat(locale, { style: "percent" }).format(v / 100),
                  ];
                }}
              />
              <ReferenceLine
                x={Math.round(avgRatio * 100)}
                stroke="var(--color-secondary)"
                strokeDasharray="4 4"
                label={{
                  value: labels.cohortAverage,
                  position: "top",
                  fontSize: 10,
                  fill: "var(--color-secondary)",
                }}
              />
              <Bar dataKey="ratio" isAnimationActive={false}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </RechartsSizedFrame>
    </section>
  );
}
