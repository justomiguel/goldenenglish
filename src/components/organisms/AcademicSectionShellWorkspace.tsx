"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
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
import {
  type AcademicSectionShellAreaId,
  parseAcademicSectionShellTabParam,
} from "@/lib/academics/academicSectionShellTabOrder";
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

function areaFromLocationSearch(search: string, flags: AcademicSectionFeatureFlags) {
  const tab = parseAcademicSectionShellTabParam(new URLSearchParams(search).get("tab") ?? undefined);
  return resolveAcademicSectionShellArea(tab, flags);
}

/**
 * Next.js treats a bare `pushState` as a router restore and refetches the
 * section page. The URL changes and the hub stays. `__NA` keeps the entry
 * in history and skips that restore. The panel switches from local state.
 */
function pushAreaUrl(url: string) {
  const prev = window.history.state as { __PRIVATE_NEXTJS_INTERNALS_TREE?: unknown } | null;
  window.history.pushState(
    {
      ...(prev ?? {}),
      __NA: true,
      __PRIVATE_NEXTJS_INTERNALS_TREE: prev?.__PRIVATE_NEXTJS_INTERNALS_TREE,
    },
    "",
    url,
  );
}

export interface AcademicSectionShellWorkspaceProps {
  labels: AcademicSectionShellWorkspaceLabels;
  featureFlags: AcademicSectionFeatureFlags;
  /** Resolved from `?tab=` on the server; `null` = hub. */
  initialArea?: AcademicSectionShellAreaId | null;
  enrollmentLinkPanel?: ReactNode;
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
  enrollmentLinkPanel,
  hubOverview,
  configuration,
  teachers,
  learningRoute,
  evaluations,
  fees,
  attendance,
  students,
}: AcademicSectionShellWorkspaceProps) {
  const pathname = usePathname();
  const evalOn = featureFlags.requiresEvaluationsToPass;
  const routeOn = featureFlags.usesLearningRoute;
  const flags = useMemo(
    () => ({ requiresEvaluationsToPass: evalOn, usesLearningRoute: routeOn }),
    [evalOn, routeOn],
  );
  const areas = useMemo(() => visibleAcademicSectionHubAreas(flags), [flags]);
  const [area, setArea] = useState<AcademicSectionShellAreaId | null>(() =>
    resolveAcademicSectionShellArea(initialArea ?? undefined, flags),
  );

  useEffect(() => {
    const onPop = () => setArea(areaFromLocationSearch(window.location.search, flags));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [flags]);

  const navigate = (next: AcademicSectionShellAreaId | null) => {
    setArea(resolveAcademicSectionShellArea(next ?? undefined, flags));
    const url = next ? `${pathname}?tab=${encodeURIComponent(next)}` : pathname;
    pushAreaUrl(url);
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
      <div className="space-y-5 sm:space-y-6">
        {enrollmentLinkPanel}
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.generalLead}</p>
        <AcademicSectionShellHub
          areasAria={labels.hubAreasAria}
          areas={areas}
          cardLabels={cardLabels}
          onOpenArea={(id) => navigate(id)}
        />
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-4 shadow-[var(--shadow-soft)] sm:px-5 sm:py-5">
          {hubOverview}
        </div>
      </div>
    );
  }

  const Icon = AREA_ICONS[area];
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
      <AcademicSectionShellAreaChrome
        backLabel={labels.backToSection}
        title={labels[area]}
        switcherAria={labels.areaSwitcherAria}
        area={area}
        options={switcherOptions}
        onBack={() => navigate(null)}
        onSwitchArea={(id) => navigate(id)}
      />
      <div className="space-y-4 px-3 py-3 sm:px-5 sm:py-5">
        <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
          {labels[`${area}Lead` as keyof AcademicSectionShellWorkspaceLabels] as string}
        </p>
        {panels[area]}
      </div>
    </div>
  );
}
