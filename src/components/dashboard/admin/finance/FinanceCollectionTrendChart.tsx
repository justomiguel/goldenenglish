"use client";

import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import type { FinanceMonthlyTrendPoint } from "@/types/financeAnalytics";
import type { Dictionary } from "@/types/i18n";

type TrendDict = Dictionary["admin"]["finance"]["insights"]["trend"];

export interface FinanceCollectionTrendChartProps {
  trend: FinanceMonthlyTrendPoint[];
  locale: string;
  labels: TrendDict;
}

function monthLabel(month: number, locale: string): string {
  const d = new Date(2024, month - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
}

export function FinanceCollectionTrendChart({
  trend,
  locale,
  labels,
}: FinanceCollectionTrendChartProps) {
  const data = trend.map((t) => ({
    name: monthLabel(t.month, locale),
    collected: t.collected,
    pending: t.pending,
    overdue: t.overdue,
    ratio: Math.round(t.ratio * 100),
  }));

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="font-semibold text-[var(--color-primary)]">
        {labels.title}
      </h3>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.hint}
      </p>
      <RechartsSizedFrame height={320} className="mt-4 w-full min-w-0">
        {(w, h) => (
          <ResponsiveContainer width={w} height={h} minWidth={0}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="amount"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) =>
                  Intl.NumberFormat(locale, { notation: "compact" }).format(v)
                }
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                formatter={(value, name) => {
                  const n =
                    typeof value === "number"
                      ? value
                      : typeof value === "string"
                        ? Number(value)
                        : NaN;
                  const label =
                    typeof name === "string" ? name : String(name ?? "");
                  if (!Number.isFinite(n)) return ["", label];
                  if (label === labels.ratio) return [`${n}%`, label];
                  return [
                    Intl.NumberFormat(locale, {
                      style: "decimal",
                      minimumFractionDigits: 2,
                    }).format(n),
                    label,
                  ];
                }}
              />
              <Legend />
              <Bar
                yAxisId="amount"
                dataKey="collected"
                stackId="a"
                fill="var(--color-primary)"
                name={labels.collected}
                isAnimationActive={false}
              />
              <Bar
                yAxisId="amount"
                dataKey="pending"
                stackId="a"
                fill="var(--color-accent)"
                name={labels.pending}
                isAnimationActive={false}
              />
              <Bar
                yAxisId="amount"
                dataKey="overdue"
                stackId="a"
                fill="var(--color-error)"
                name={labels.overdue}
                isAnimationActive={false}
              />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="ratio"
                stroke="var(--color-secondary)"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={labels.ratio}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </RechartsSizedFrame>
    </section>
  );
}
