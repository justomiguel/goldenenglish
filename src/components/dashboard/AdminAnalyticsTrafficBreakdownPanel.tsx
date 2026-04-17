"use client";

import { useId, useMemo } from "react";
import { CircleUser, Users, Bot } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import type { Dictionary } from "@/types/i18n";
import type { TrafficVisitorKind } from "@/lib/dashboard/loadAdminTrafficKindBreakdowns";
import { TrafficBreakdownPathsTable } from "@/components/dashboard/TrafficBreakdownPathsTable";
import { TrafficBreakdownAgentsTable } from "@/components/dashboard/TrafficBreakdownAgentsTable";

export type TrafficKindBreakdown = {
  paths: { pathname: string; cnt: number }[];
  agents: { user_agent: string; cnt: number }[];
};

export type TrafficKindBreakdowns = Record<TrafficVisitorKind, TrafficKindBreakdown>;

interface AdminAnalyticsTrafficBreakdownPanelProps {
  locale: string;
  labels: Dictionary["admin"]["analytics"];
  breakdowns: TrafficKindBreakdowns;
  /** Initial tab (driven by which summary card the user clicked). */
  activeKind: TrafficVisitorKind;
  /** Notifies the parent when the user changes tabs (so the matching card stays in sync). */
  onActiveKindChange: (k: TrafficVisitorKind) => void;
}

const KIND_ICONS = {
  authenticated: CircleUser,
  guest: Users,
  bot: Bot,
} as const;

export function AdminAnalyticsTrafficBreakdownPanel({
  locale,
  labels,
  breakdowns,
  activeKind,
  onActiveKindChange,
}: AdminAnalyticsTrafficBreakdownPanelProps) {
  const reactId = useId().replace(/[:]/g, "");
  const idPrefix = `admin-traffic-breakdown-${reactId}`;
  const nf = useMemo(
    () => new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", { maximumFractionDigits: 0 }),
    [locale],
  );

  const tabs: UnderlineTabItem[] = useMemo(
    () => [
      { id: "authenticated", label: labels.trafficAuth, Icon: KIND_ICONS.authenticated },
      { id: "guest", label: labels.trafficGuest, Icon: KIND_ICONS.guest },
      { id: "bot", label: labels.trafficBot, Icon: KIND_ICONS.bot },
    ],
    [labels.trafficAuth, labels.trafficGuest, labels.trafficBot],
  );

  return (
    <div className="mt-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15">
      <UnderlineTabBar
        idPrefix={idPrefix}
        ariaLabel={labels.trafficBreakdownTabsAria}
        items={tabs}
        value={activeKind}
        onChange={(id) => onActiveKindChange(id as TrafficVisitorKind)}
        dense
      />
      {(["authenticated", "guest", "bot"] as TrafficVisitorKind[]).map((k) => {
        const data = breakdowns[k];
        const isActive = k === activeKind;
        return (
          <div
            key={k}
            id={underlinePanelId(idPrefix, k)}
            role="tabpanel"
            aria-labelledby={underlineTabId(idPrefix, k)}
            hidden={!isActive}
            className="grid gap-4 p-4 lg:grid-cols-2"
          >
            <TrafficBreakdownPathsTable
              labels={labels}
              kind={k}
              rows={data.paths}
              nf={nf}
            />
            <TrafficBreakdownAgentsTable
              labels={labels}
              kind={k}
              rows={data.agents}
              nf={nf}
            />
          </div>
        );
      })}
    </div>
  );
}
