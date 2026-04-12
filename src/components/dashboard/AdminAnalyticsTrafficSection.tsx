"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { Dictionary } from "@/types/i18n";

export type TrafficSummary = {
  authenticated_hits: number;
  guest_hits: number;
  bot_hits: number;
  total_hits: number;
};

export type TrafficDailyRow = {
  day: string;
  authenticated_hits: number;
  guest_hits: number;
  bot_hits: number;
};

interface AdminAnalyticsTrafficSectionProps {
  labels: Dictionary["admin"]["analytics"];
  summary: TrafficSummary;
  daily: TrafficDailyRow[];
}

export function AdminAnalyticsTrafficSection({
  labels,
  summary,
  daily,
}: AdminAnalyticsTrafficSectionProps) {
  const reducedMotion = usePrefersReducedMotion();
  const animate = !reducedMotion;
  const chartData = daily.map((r) => ({
    day: r.day,
    auth: Number(r.authenticated_hits),
    guest: Number(r.guest_hits),
    bot: Number(r.bot_hits),
  }));

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="font-semibold text-[var(--color-primary)]">{labels.trafficTitle}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.trafficHint}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.trafficTotal}</p>
          <p className="text-xl font-semibold text-[var(--color-primary)]">{summary.total_hits}</p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] p-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.trafficAuth}</p>
          <p className="text-xl font-semibold text-[var(--color-primary)]">
            {summary.authenticated_hits}
          </p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] p-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.trafficGuest}</p>
          <p className="text-xl font-semibold text-[var(--color-accent)]">{summary.guest_hits}</p>
        </div>
        <div className="rounded-md border border-[var(--color-border)] p-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.trafficBot}</p>
          <p className="text-xl font-semibold text-[var(--color-secondary)]">{summary.bot_hits}</p>
        </div>
      </div>

      <RechartsSizedFrame height={288} className="mt-6 w-full min-w-0">
        {(w, h) => (
          <ResponsiveContainer width={w} height={h} minWidth={0}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                isAnimationActive={animate}
                dataKey="auth"
                stackId="1"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                name={labels.trafficAuth}
              />
              <Area
                type="monotone"
                isAnimationActive={animate}
                dataKey="guest"
                stackId="1"
                stroke="var(--color-accent)"
                fill="var(--color-accent)"
                name={labels.trafficGuest}
              />
              <Area
                type="monotone"
                isAnimationActive={animate}
                dataKey="bot"
                stackId="1"
                stroke="var(--color-secondary)"
                fill="var(--color-secondary)"
                name={labels.trafficBot}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </RechartsSizedFrame>
    </section>
  );
}
