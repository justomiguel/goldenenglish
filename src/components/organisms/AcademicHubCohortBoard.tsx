"use client";

import { useId, useState, type ReactNode } from "react";
import { Archive, Layers, Sparkles } from "lucide-react";
import type { AcademicHubCohortSummary, AcademicHubCohortRowLabels } from "@/components/molecules/AcademicHubCohortRow";
import { AcademicHubCohortRow } from "@/components/molecules/AcademicHubCohortRow";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";

export interface AcademicHubCohortBoardDict {
  currentTitle: string;
  currentLead: string;
  activeTitle: string;
  activeLead: string;
  archivedTitle: string;
  archivedLead: string;
  emptyActive: string;
  emptyArchived: string;
  emptyAll: string;
  noCurrentBanner: string;
  tabs: {
    tablistAria: string;
    current: string;
    active: string;
    archived: string;
    emptyCurrent: string;
  };
}

export interface AcademicHubCohortBoardProps {
  locale: string;
  current: AcademicHubCohortSummary | null;
  active: AcademicHubCohortSummary[];
  archived: AcademicHubCohortSummary[];
  boardDict: AcademicHubCohortBoardDict;
  rowLabels: AcademicHubCohortRowLabels;
  hasAnyCohort: boolean;
}

type HubTab = "current" | "active" | "archived";

export function AcademicHubCohortBoard({
  locale,
  current,
  active,
  archived,
  boardDict,
  rowLabels,
  hasAnyCohort,
}: AcademicHubCohortBoardProps) {
  const idPrefix = useId().replace(/:/g, "");
  const [tab, setTab] = useState<HubTab>(() => (current ? "current" : "active"));

  const tabItems: UnderlineTabItem[] = [
    { id: "current", label: boardDict.tabs.current, Icon: Sparkles },
    { id: "active", label: boardDict.tabs.active, Icon: Layers },
    { id: "archived", label: boardDict.tabs.archived, Icon: Archive },
  ];

  if (!hasAnyCohort) {
    return (
      <div className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/20 px-4 py-12 text-center text-sm text-[var(--color-muted-foreground)]">
        {boardDict.emptyAll}
      </div>
    );
  }

  const banner: ReactNode =
    current ? null : (
      <p
        className="mb-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-[var(--color-foreground)]"
        role="status"
      >
        {boardDict.noCurrentBanner}
      </p>
    );

  const leads: Record<HubTab, { title: string; lead: string }> = {
    current: { title: boardDict.currentTitle, lead: boardDict.currentLead },
    active: { title: boardDict.activeTitle, lead: boardDict.activeLead },
    archived: { title: boardDict.archivedTitle, lead: boardDict.archivedLead },
  };

  const empties: Record<HubTab, string> = {
    current: boardDict.tabs.emptyCurrent,
    active: boardDict.emptyActive,
    archived: boardDict.emptyArchived,
  };

  const lists: Record<HubTab, AcademicHubCohortSummary[]> = {
    current: current ? [current] : [],
    active,
    archived,
  };

  return (
    <div className="space-y-4">
      {banner}
      <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <UnderlineTabBar
          idPrefix={idPrefix}
          ariaLabel={boardDict.tabs.tablistAria}
          items={tabItems}
          value={tab}
          onChange={(id) => setTab(id as HubTab)}
        />
        {(["current", "active", "archived"] as const).map((t) => {
          const rows = lists[t];
          const selected = tab === t;
          const { title, lead } = leads[t];
          return (
            <div
              key={t}
              id={underlinePanelId(idPrefix, t)}
              role="tabpanel"
              aria-labelledby={underlineTabId(idPrefix, t)}
              hidden={!selected}
              tabIndex={0}
              className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
                </div>
                {rows.length === 0 ? (
                  <p className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/25 px-3 py-4 text-sm text-[var(--color-muted-foreground)]">
                    {empties[t]}
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--color-border)] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                    {rows.map((c) => (
                      <AcademicHubCohortRow
                        key={c.id}
                        c={c}
                        locale={locale}
                        labels={rowLabels}
                        isCurrent={c.is_current}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
