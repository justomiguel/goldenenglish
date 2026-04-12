"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AttendanceRow } from "@/lib/attendance/stats";
import {
  consecutivePresentStreak,
  mandatoryAttendanceStats,
} from "@/lib/attendance/stats";

interface AttendancePlayboardProps {
  rows: AttendanceRow[];
  labels: Dictionary["dashboard"]["student"];
}

const COLORS = {
  ok: "var(--color-accent)",
  miss: "var(--color-secondary)",
  other: "var(--color-primary-light)",
};

export function AttendancePlayboard({ rows, labels }: AttendancePlayboardProps) {
  const { present, absent, total } = mandatoryAttendanceStats(rows);
  const streak = consecutivePresentStreak(rows);
  const chartData = [
    { name: labels.mandatoryMet, value: present },
    { name: labels.mandatoryMiss, value: absent },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-muted)]/40 p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/25 text-[var(--color-accent-foreground)]">
            <Flame className="h-8 w-8" aria-hidden strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {labels.streak}
            </p>
            <p className="font-display text-4xl font-bold text-[var(--color-primary)]">
              {streak}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {labels.streakHint}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <h2 className="mb-2 font-display text-lg font-semibold text-[var(--color-secondary)]">
          {labels.attendance}
        </h2>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          {labels.mandatoryMet}: {present} / {total || labels.emptyValue}
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "var(--layout-border-radius)",
                  border: "1px solid var(--color-border)",
                }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? COLORS.ok : COLORS.miss} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
