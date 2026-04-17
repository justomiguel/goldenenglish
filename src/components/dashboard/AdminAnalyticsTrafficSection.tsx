"use client";

import { useState } from "react";
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
import {
  AdminAnalyticsTrafficBreakdownPanel,
  type TrafficKindBreakdowns,
} from "@/components/dashboard/AdminAnalyticsTrafficBreakdownPanel";
import type { TrafficVisitorKind } from "@/lib/dashboard/loadAdminTrafficKindBreakdowns";

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
  locale: string;
  labels: Dictionary["admin"]["analytics"];
  summary: TrafficSummary;
  daily: TrafficDailyRow[];
  /**
   * Pre-loaded top URLs + User-Agents per visitor kind. Bounded server-side by
   * the RPC (see migration 047) so the payload stays tab-friendly.
   */
  breakdowns: TrafficKindBreakdowns;
}

interface SummaryStaticCardProps {
  title: string;
  value: number;
  tooltip: string;
  emphasis?: "primary" | "muted";
}

function SummaryStaticCard({ title, value, tooltip, emphasis }: SummaryStaticCardProps) {
  const surface =
    emphasis === "muted"
      ? "border-[var(--color-border)] bg-[var(--color-muted)]/30"
      : "border-[var(--color-border)]";
  return (
    <div className={`rounded-md border p-3 ${surface}`} title={tooltip}>
      <p className="text-xs text-[var(--color-muted-foreground)]">{title}</p>
      <p className="text-xl font-semibold text-[var(--color-primary)]">{value}</p>
    </div>
  );
}

interface SummaryActionCardProps {
  title: string;
  value: number;
  tooltip: string;
  ariaLabel: string;
  active: boolean;
  valueClassName: string;
  onActivate: () => void;
}

/**
 * Clickable summary card that opens the matching tab in the breakdown panel.
 * Matches the visual weight of `SummaryStaticCard` but is a button so keyboard
 * + screen reader users discover it (and so the active state has a focus ring).
 */
function SummaryActionCard({
  title,
  value,
  tooltip,
  ariaLabel,
  active,
  valueClassName,
  onActivate,
}: SummaryActionCardProps) {
  const activeRing = active
    ? "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-surface)]"
    : "";
  return (
    <button
      type="button"
      onClick={onActivate}
      title={tooltip}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`group rounded-md border border-[var(--color-border)] p-3 text-left transition-colors hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${activeRing}`}
    >
      <p className="text-xs text-[var(--color-muted-foreground)]">{title}</p>
      <p className={`text-xl font-semibold ${valueClassName}`}>{value}</p>
    </button>
  );
}

export function AdminAnalyticsTrafficSection({
  locale,
  labels,
  summary,
  daily,
  breakdowns,
}: AdminAnalyticsTrafficSectionProps) {
  const reducedMotion = usePrefersReducedMotion();
  const animate = !reducedMotion;
  const [activeKind, setActiveKind] = useState<TrafficVisitorKind | null>(null);

  const chartData = daily.map((r) => ({
    day: r.day,
    auth: Number(r.authenticated_hits),
    guest: Number(r.guest_hits),
    bot: Number(r.bot_hits),
  }));

  const toggleKind = (kind: TrafficVisitorKind) => {
    setActiveKind((prev) => (prev === kind ? null : kind));
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="font-semibold text-[var(--color-primary)]">{labels.trafficTitle}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.trafficHint}</p>
      <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{labels.trafficCardsHint}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStaticCard
          title={labels.trafficTotal}
          value={summary.total_hits}
          tooltip={labels.tipTrafficStatTotal}
          emphasis="muted"
        />
        <SummaryActionCard
          title={labels.trafficAuth}
          value={summary.authenticated_hits}
          tooltip={labels.tipTrafficStatAuth}
          ariaLabel={labels.trafficCardAriaAuth}
          active={activeKind === "authenticated"}
          valueClassName="text-[var(--color-primary)]"
          onActivate={() => toggleKind("authenticated")}
        />
        <SummaryActionCard
          title={labels.trafficGuest}
          value={summary.guest_hits}
          tooltip={labels.tipTrafficStatGuest}
          ariaLabel={labels.trafficCardAriaGuest}
          active={activeKind === "guest"}
          valueClassName="text-[var(--color-accent)]"
          onActivate={() => toggleKind("guest")}
        />
        <SummaryActionCard
          title={labels.trafficBot}
          value={summary.bot_hits}
          tooltip={labels.tipTrafficStatBot}
          ariaLabel={labels.trafficCardAriaBot}
          active={activeKind === "bot"}
          valueClassName="text-[var(--color-secondary)]"
          onActivate={() => toggleKind("bot")}
        />
      </div>

      {activeKind ? (
        <AdminAnalyticsTrafficBreakdownPanel
          locale={locale}
          labels={labels}
          breakdowns={breakdowns}
          activeKind={activeKind}
          onActiveKindChange={setActiveKind}
        />
      ) : null}

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
