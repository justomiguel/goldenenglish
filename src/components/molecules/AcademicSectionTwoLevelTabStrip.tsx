"use client";

import { LayoutDashboard, Route, Users } from "lucide-react";
import { UnderlineTabBar, type UnderlineTabItem } from "@/components/molecules/UnderlineTabBar";
import type {
  AcademicSectionShellGroupId,
  AcademicSectionShellTabId,
} from "@/types/academicSectionShell";

export const ACADEMIC_SECTION_SHELL_GROUP_ORDER: {
  id: AcademicSectionShellGroupId;
  tabs: readonly AcademicSectionShellTabId[];
}[] = [
  { id: "setup", tabs: ["general", "configuration", "teachers"] as const },
  { id: "pathAndFees", tabs: ["learningRoute", "fees"] as const },
  { id: "classRoster", tabs: ["attendance", "students"] as const },
] as const;

const GROUP_ICONS: Record<AcademicSectionShellGroupId, typeof LayoutDashboard> = {
  setup: LayoutDashboard,
  pathAndFees: Route,
  classRoster: Users,
};

export function groupIdForTab(tab: AcademicSectionShellTabId): AcademicSectionShellGroupId {
  for (const g of ACADEMIC_SECTION_SHELL_GROUP_ORDER) {
    if ((g.tabs as readonly string[]).includes(tab)) return g.id;
  }
  return "setup";
}

function firstTabInGroup(group: AcademicSectionShellGroupId): AcademicSectionShellTabId {
  const row = ACADEMIC_SECTION_SHELL_GROUP_ORDER.find((g) => g.id === group);
  return row?.tabs[0] ?? "general";
}

export interface AcademicSectionGroupLabels {
  groupListAria: string;
  groupSetup: string;
  groupPathAndFees: string;
  groupClassRoster: string;
}

export interface AcademicSectionTwoLevelTabStripProps {
  idPrefix: string;
  tablistAria: string;
  groupLabels: AcademicSectionGroupLabels;
  allTabItems: readonly UnderlineTabItem[];
  value: AcademicSectionShellTabId;
  onTabChange: (id: AcademicSectionShellTabId) => void;
}

/**
 * First row: workspace areas (3). Second row: tabs within the area (≤3) with room for full labels.
 */
export function AcademicSectionTwoLevelTabStrip({
  idPrefix,
  tablistAria,
  groupLabels,
  allTabItems,
  value,
  onTabChange,
}: AcademicSectionTwoLevelTabStripProps) {
  const byId: Record<string, UnderlineTabItem> = Object.fromEntries(allTabItems.map((i) => [i.id, i]));
  const groupId = groupIdForTab(value);
  const activeRow = ACADEMIC_SECTION_SHELL_GROUP_ORDER.find((g) => g.id === groupId);
  const rowItems = (activeRow?.tabs ?? [])
    .map((tid) => byId[tid])
    .filter(Boolean) as UnderlineTabItem[];

  return (
    <div>
      <nav
        className="grid w-full grid-cols-1 border-b border-[var(--color-border)] bg-[var(--color-muted)]/25 sm:grid-cols-3"
        aria-label={groupLabels.groupListAria}
      >
        {ACADEMIC_SECTION_SHELL_GROUP_ORDER.map((g) => {
          const isActive = g.id === groupId;
          const GIcon = GROUP_ICONS[g.id];
          const label =
            g.id === "setup"
              ? groupLabels.groupSetup
              : g.id === "pathAndFees"
                ? groupLabels.groupPathAndFees
                : groupLabels.groupClassRoster;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                if (g.id === groupId) return;
                onTabChange(firstTabInGroup(g.id));
              }}
              className={`relative flex min-h-[48px] items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:px-2 ${
                isActive
                  ? "text-[var(--color-primary)] after:absolute after:inset-x-1 after:bottom-0 after:h-[3px] after:rounded-t after:bg-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/30 hover:text-[var(--color-foreground)]"
              }`}
            >
              <GIcon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="text-center text-balance leading-tight sm:px-0.5">{label}</span>
            </button>
          );
        })}
      </nav>
      <UnderlineTabBar
        idPrefix={idPrefix}
        ariaLabel={tablistAria}
        items={rowItems}
        value={value}
        onChange={(id) => onTabChange(id as AcademicSectionShellTabId)}
        dense
        allowLabelWrap
      />
    </div>
  );
}
