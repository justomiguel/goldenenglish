"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Inbox, LayoutDashboard, Layers, TriangleAlert } from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";

export type AcademicCohortDetailTabId = "overview" | "sections" | "retention" | "transfers";

export interface AcademicCohortDetailShellLabels {
  tablistAria: string;
  overview: string;
  overviewLead: string;
  sections: string;
  retention: string;
  retentionLead: string;
  transfers: string;
  transfersLead: string;
}

export interface AcademicCohortDetailShellProps {
  labels: AcademicCohortDetailShellLabels;
  defaultTab?: AcademicCohortDetailTabId;
  overview: ReactNode;
  sections: ReactNode;
  retention: ReactNode;
  transferInbox: ReactNode;
}

const ORDER: AcademicCohortDetailTabId[] = ["overview", "sections", "retention", "transfers"];

export function AcademicCohortDetailShell({
  labels,
  defaultTab = "overview",
  overview,
  sections,
  retention,
  transferInbox,
}: AcademicCohortDetailShellProps) {
  const idPrefix = useId().replace(/:/g, "");
  const [tab, setTab] = useState<AcademicCohortDetailTabId>(defaultTab);

  const items: UnderlineTabItem[] = useMemo(
    () => [
      { id: "overview", label: labels.overview, Icon: LayoutDashboard },
      { id: "sections", label: labels.sections, Icon: Layers },
      { id: "retention", label: labels.retention, Icon: TriangleAlert },
      { id: "transfers", label: labels.transfers, Icon: Inbox },
    ],
    [labels.overview, labels.sections, labels.retention, labels.transfers],
  );

  const panelContent: Record<AcademicCohortDetailTabId, ReactNode> = {
    overview: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.overviewLead}</p>
        {overview}
      </div>
    ),
    sections,
    retention: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.retentionLead}</p>
        {retention}
      </div>
    ),
    transfers: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.transfersLead}</p>
        {transferInbox}
      </div>
    ),
  };

  return (
    <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <UnderlineTabBar
        idPrefix={idPrefix}
        ariaLabel={labels.tablistAria}
        items={items}
        value={tab}
        onChange={(id) => setTab(id as AcademicCohortDetailTabId)}
        dense
      />
      {ORDER.map((t) => {
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
