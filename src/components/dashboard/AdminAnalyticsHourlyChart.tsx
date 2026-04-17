"use client";

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
import type { Dictionary } from "@/types/i18n";
import { pivotAdminAnalyticsHourly } from "@/lib/dashboard/pivotAdminAnalyticsHourly";

export type AdminAnalyticsHourlyRow = { hour: number; role: string; cnt: number };

interface AdminAnalyticsHourlyChartProps {
  rows: AdminAnalyticsHourlyRow[];
  animate: boolean;
  labels: Pick<
    Dictionary["admin"]["analytics"],
    "chartHourly" | "chartHourlyHint" | "roleStudent" | "roleParent" | "roleTeacher" | "roleAdmin"
  >;
}

export function AdminAnalyticsHourlyChart({ rows, animate, labels }: AdminAnalyticsHourlyChartProps) {
  const heatData = pivotAdminAnalyticsHourly(rows);
  return (
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
  );
}
