"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, LayoutDashboard, UserPlus, Users } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";

export type AcademicSectionShellTabId = "general" | "schedule" | "enroll" | "roster";

export interface AcademicSectionShellTabsLabels {
  tablistAria: string;
  general: string;
  generalLead: string;
  schedule: string;
  enroll: string;
  roster: string;
}

const TAB_ORDER: AcademicSectionShellTabId[] = ["general", "schedule", "enroll", "roster"];

const TAB_ICONS: Record<AcademicSectionShellTabId, LucideIcon> = {
  general: LayoutDashboard,
  schedule: CalendarDays,
  enroll: UserPlus,
  roster: Users,
};

export interface AcademicSectionShellTabsProps {
  labels: AcademicSectionShellTabsLabels;
  defaultTab?: AcademicSectionShellTabId;
  general: ReactNode;
  schedule: ReactNode;
  enroll: ReactNode;
  roster: ReactNode;
}

export function AcademicSectionShellTabs({
  labels,
  defaultTab = "general",
  general,
  schedule,
  enroll,
  roster,
}: AcademicSectionShellTabsProps) {
  const idPrefix = useId().replace(/:/g, "");
  const [tab, setTab] = useState<AcademicSectionShellTabId>(defaultTab);

  const items: UnderlineTabItem[] = useMemo(
    () =>
      TAB_ORDER.map((t) => ({
        id: t,
        label:
          t === "general"
            ? labels.general
            : t === "schedule"
              ? labels.schedule
              : t === "enroll"
                ? labels.enroll
                : labels.roster,
        Icon: TAB_ICONS[t],
      })),
    [labels],
  );

  const panelContent: Record<AcademicSectionShellTabId, ReactNode> = {
    general: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.generalLead}</p>
        {general}
      </div>
    ),
    schedule,
    enroll,
    roster,
  };

  return (
    <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <UnderlineTabBar
        idPrefix={idPrefix}
        ariaLabel={labels.tablistAria}
        items={items}
        value={tab}
        onChange={(id) => setTab(id as AcademicSectionShellTabId)}
        dense
      />
      {TAB_ORDER.map((t) => {
        const selected = tab === t;
        return (
          <div
            key={t}
            id={underlinePanelId(idPrefix, t)}
            role="tabpanel"
            aria-labelledby={underlineTabId(idPrefix, t)}
            hidden={!selected}
            tabIndex={0}
            className="px-4 py-4 outline-none sm:px-5 sm:py-5 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            {panelContent[t]}
          </div>
        );
      })}
    </div>
  );
}
