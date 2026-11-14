"use client";

import { useId, type ReactNode } from "react";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import { Archive, Layers } from "lucide-react";
import type { AcademicHubCohortSummary, AcademicHubCohortRowLabels } from "@/components/molecules/AcademicHubCohortRow";
import { AcademicHubCohortRow } from "@/components/molecules/AcademicHubCohortRow";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

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

type HubTab = "active" | "archived";

const HUB_TABS: readonly HubTab[] = ["active", "archived"];

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
  const { value: tab, setValue: setTab } = usePersistentPageTab<HubTab>({
    allowed: HUB_TABS,
    fallback: "active",
  });

  const tabItems: UnderlineTabItem[] = [
    { id: "active", label: boardDict.tabs.active, Icon: Layers },
    { id: "archived", label: boardDict.tabs.archived, Icon: Archive },
  ];

  if (!hasAnyCohort) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-4 py-12 text-center text-sm text-[var(--color-muted-foreground)] shadow-[var(--shadow-soft)]">
        {boardDict.emptyAll}
      </div>
    );
  }

  const banner: ReactNode = current ? null : (
    <p
      className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary)]/8 px-4 py-3 text-sm text-[var(--color-foreground)]"
      role="status"
    >
      {boardDict.noCurrentBanner}
    </p>
  );

  return (
    <div className="space-y-4">
      {banner}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
        <div data-tour={ADMIN_TOUR_ANCHORS.academicBoardTabs}>
          <UnderlineTabBar
            idPrefix={idPrefix}
            ariaLabel={boardDict.tabs.tablistAria}
            items={tabItems}
            value={tab}
            onChange={(id) => setTab(id as HubTab)}
          />
        </div>
        <CohortTabPanel
          idPrefix={idPrefix}
          tabId="active"
          selected={tab === "active"}
          title={boardDict.activeTitle}
          lead={boardDict.activeLead}
          tourAnchor={ADMIN_TOUR_ANCHORS.academicCohortList}
        >
          {current ? (
            <div
              role="region"
              aria-label={boardDict.currentTitle}
              data-current-cohort=""
              className="rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10"
            >
              <AcademicHubCohortRow c={current} locale={locale} labels={rowLabels} isCurrent />
            </div>
          ) : null}
          {active.length > 0 ? (
            <CohortRowList locale={locale} rows={active} labels={rowLabels} />
          ) : current ? null : (
            <EmptyCohortNote>{boardDict.emptyActive}</EmptyCohortNote>
          )}
        </CohortTabPanel>
        <CohortTabPanel
          idPrefix={idPrefix}
          tabId="archived"
          selected={tab === "archived"}
          title={boardDict.archivedTitle}
          lead={boardDict.archivedLead}
        >
          {archived.length === 0 ? (
            <EmptyCohortNote>{boardDict.emptyArchived}</EmptyCohortNote>
          ) : (
            <CohortRowList locale={locale} rows={archived} labels={rowLabels} />
          )}
        </CohortTabPanel>
      </div>
    </div>
  );
}

function CohortTabPanel({
  idPrefix,
  tabId,
  selected,
  title,
  lead,
  tourAnchor,
  children,
}: {
  idPrefix: string;
  tabId: HubTab;
  selected: boolean;
  title: string;
  lead: string;
  tourAnchor?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={underlinePanelId(idPrefix, tabId)}
      role="tabpanel"
      aria-labelledby={underlineTabId(idPrefix, tabId)}
      hidden={!selected}
      tabIndex={0}
      className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
    >
      <div className="space-y-3 px-3 py-3 sm:px-5 sm:py-5" data-tour={tourAnchor}>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
          <p className="mt-1 hidden text-sm text-[var(--color-muted-foreground)] sm:block">{lead}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function CohortRowList({
  locale,
  rows,
  labels,
}: {
  locale: string;
  rows: AcademicHubCohortSummary[];
  labels: AcademicHubCohortRowLabels;
}) {
  return (
    <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
      {rows.map((c) => (
        <AcademicHubCohortRow key={c.id} c={c} locale={locale} labels={labels} isCurrent={c.is_current} />
      ))}
    </div>
  );
}

function EmptyCohortNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-[var(--color-muted)]/25 px-3 py-4 text-sm text-[var(--color-muted-foreground)]">
      {children}
    </p>
  );
}
