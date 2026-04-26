"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Route,
  Settings2,
  Users,
} from "lucide-react";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import {
  type AcademicSectionShellTabId,
  ACADEMIC_SECTION_SHELL_TAB_ORDER,
} from "@/lib/academics/academicSectionShellTabOrder";

export type { AcademicSectionShellTabId };

export interface AcademicSectionShellTabsLabels {
  tablistAria: string;
  general: string;
  generalLead: string;
  configuration: string;
  configurationLead: string;
  teachers: string;
  teachersLead: string;
  learningRoute: string;
  learningRouteLead: string;
  evaluations: string;
  evaluationsLead: string;
  fees: string;
  feesLead: string;
  attendance: string;
  attendanceLead: string;
  students: string;
  studentsLead: string;
}

const TAB_ORDER: readonly AcademicSectionShellTabId[] = ACADEMIC_SECTION_SHELL_TAB_ORDER;

const TAB_ICONS: Record<AcademicSectionShellTabId, LucideIcon> = {
  general: LayoutDashboard,
  configuration: Settings2,
  teachers: GraduationCap,
  learningRoute: Route,
  evaluations: ClipboardCheck,
  fees: CircleDollarSign,
  attendance: ClipboardList,
  students: Users,
};

const TAB_LABEL_KEY: Record<AcademicSectionShellTabId, keyof AcademicSectionShellTabsLabels> = {
  general: "general",
  configuration: "configuration",
  teachers: "teachers",
  learningRoute: "learningRoute",
  evaluations: "evaluations",
  fees: "fees",
  attendance: "attendance",
  students: "students",
};

export interface AcademicSectionShellTabsProps {
  labels: AcademicSectionShellTabsLabels;
  defaultTab?: AcademicSectionShellTabId;
  general: ReactNode;
  configuration: ReactNode;
  teachers: ReactNode;
  learningRoute: ReactNode;
  evaluations: ReactNode;
  fees: ReactNode;
  attendance: ReactNode;
  students: ReactNode;
}

export function AcademicSectionShellTabs({
  labels,
  defaultTab = "general",
  general,
  configuration,
  teachers,
  learningRoute,
  evaluations,
  fees,
  attendance,
  students,
}: AcademicSectionShellTabsProps) {
  const idPrefix = useId().replace(/:/g, "");
  const [tab, setTab] = useState<AcademicSectionShellTabId>(defaultTab);

  const items: UnderlineTabItem[] = useMemo(
    () =>
      TAB_ORDER.map((t) => ({
        id: t,
        label: labels[TAB_LABEL_KEY[t]],
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
    configuration: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.configurationLead}</p>
        {configuration}
      </div>
    ),
    teachers: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.teachersLead}</p>
        {teachers}
      </div>
    ),
    learningRoute: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.learningRouteLead}</p>
        {learningRoute}
      </div>
    ),
    evaluations: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.evaluationsLead}</p>
        {evaluations}
      </div>
    ),
    fees: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.feesLead}</p>
        {fees}
      </div>
    ),
    attendance: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.attendanceLead}</p>
        {attendance}
      </div>
    ),
    students: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.studentsLead}</p>
        {students}
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
        onChange={(id) => setTab(id as AcademicSectionShellTabId)}
        dense
        layout="gridTwoRow"
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
