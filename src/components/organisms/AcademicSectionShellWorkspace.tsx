"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Route,
  Settings2,
  Users,
} from "lucide-react";
import { AcademicSectionShellHub } from "@/components/organisms/AcademicSectionShellHub";
import { AcademicSectionShellAreaChrome } from "@/components/molecules/AcademicSectionShellAreaChrome";
import type { AcademicSectionShellAreaId } from "@/lib/academics/academicSectionShellTabOrder";
import {
  type AcademicSectionFeatureFlags,
  resolveAcademicSectionShellArea,
  visibleAcademicSectionHubAreas,
} from "@/lib/academics/visibleAcademicSectionShellTabs";

export interface AcademicSectionShellWorkspaceLabels {
  hubAreasAria: string;
  backToSection: string;
  areaSwitcherAria: string;
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

const AREA_ICONS: Record<AcademicSectionShellAreaId, LucideIcon> = {
  configuration: Settings2,
  teachers: GraduationCap,
  learningRoute: Route,
  evaluations: ClipboardCheck,
  fees: CircleDollarSign,
  attendance: ClipboardList,
  students: Users,
};

export interface AcademicSectionShellWorkspaceProps {
  labels: AcademicSectionShellWorkspaceLabels;
  featureFlags: AcademicSectionFeatureFlags;
  /** Resolved from `?tab=` on the server; `null` = hub. */
  initialArea?: AcademicSectionShellAreaId | null;
  hubOverview: ReactNode;
  configuration: ReactNode;
  teachers: ReactNode;
  learningRoute: ReactNode;
  evaluations: ReactNode;
  fees: ReactNode;
  attendance: ReactNode;
  students: ReactNode;
}

export function AcademicSectionShellWorkspace({
  labels,
  featureFlags,
  initialArea = null,
  hubOverview,
  configuration,
  teachers,
  learningRoute,
  evaluations,
  fees,
  attendance,
  students,
}: AcademicSectionShellWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const flags = featureFlags;
  const areas = useMemo(() => visibleAcademicSectionHubAreas(flags), [flags]);
  const [area, setArea] = useState<AcademicSectionShellAreaId | null>(() =>
    resolveAcademicSectionShellArea(initialArea ?? undefined, flags),
  );

  const navigate = (next: AcademicSectionShellAreaId | null) => {
    setArea(next);
    const url = next ? `${pathname}?tab=${encodeURIComponent(next)}` : pathname;
    router.replace(url);
  };

  const cardLabels = useMemo(() => {
    const out = {} as Record<
      AcademicSectionShellAreaId,
      { title: string; lead: string }
    >;
    for (const id of areas) {
      out[id] = {
        title: labels[id],
        lead: labels[`${id}Lead` as keyof AcademicSectionShellWorkspaceLabels] as string,
      };
    }
    return out;
  }, [areas, labels]);

  const panels: Record<AcademicSectionShellAreaId, ReactNode> = {
    configuration,
    teachers,
    learningRoute,
    evaluations,
    fees,
    attendance,
    students,
  };

  const switcherOptions = areas.map((id) => ({ id, label: labels[id] }));

  if (area == null) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.generalLead}</p>
        <AcademicSectionShellHub
          areasAria={labels.hubAreasAria}
          areas={areas}
          cardLabels={cardLabels}
          onOpenArea={(id) => navigate(id)}
        />
        <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] px-4 py-4 sm:px-5 sm:py-5">
          {hubOverview}
        </div>
      </div>
    );
  }

  const Icon = AREA_ICONS[area];
  return (
    <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <AcademicSectionShellAreaChrome
        backLabel={labels.backToSection}
        title={labels[area]}
        switcherAria={labels.areaSwitcherAria}
        area={area}
        options={switcherOptions}
        onBack={() => navigate(null)}
        onSwitchArea={(id) => navigate(id)}
      />
      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          {labels[`${area}Lead` as keyof AcademicSectionShellWorkspaceLabels] as string}
        </p>
        {panels[area]}
      </div>
    </div>
  );
}
