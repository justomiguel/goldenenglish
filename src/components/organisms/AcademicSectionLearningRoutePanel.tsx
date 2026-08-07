"use client";

import { Route } from "lucide-react";
import { AcademicSectionAreaBlock } from "@/components/molecules/AcademicSectionAreaBlock";
import { AcademicSectionAreaSummaryBand } from "@/components/molecules/AcademicSectionAreaSummaryBand";
import { AcademicSectionLearningRouteSelector } from "@/components/organisms/AcademicSectionLearningRouteSelector";
import type {
  LearningRouteContentTemplateOption,
  SectionLearningRouteAssignment,
} from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

type LearningRouteDict = Dictionary["dashboard"]["academicSectionPage"]["learningRoute"];

export interface AcademicSectionLearningRoutePanelProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  routes: LearningRouteContentTemplateOption[];
  assignment: SectionLearningRouteAssignment | null;
  dict: LearningRouteDict;
}

function resolveCurrentRouteLabel(
  assignment: SectionLearningRouteAssignment | null,
  routes: LearningRouteContentTemplateOption[],
  dict: LearningRouteDict,
): string {
  if (assignment?.mode !== "route" || !assignment.learningRouteId) {
    return dict.freeFlowOption;
  }
  return routes.find((r) => r.id === assignment.learningRouteId)?.title ?? dict.freeFlowOption;
}

export function AcademicSectionLearningRoutePanel({
  locale,
  cohortId,
  sectionId,
  routes,
  assignment,
  dict,
}: AcademicSectionLearningRoutePanelProps) {
  const currentLabel = resolveCurrentRouteLabel(assignment, routes, dict);

  return (
    <div className="space-y-8">
      <AcademicSectionAreaSummaryBand ariaLabel={dict.summaryTitle}>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {dict.summaryTitle}
        </p>
        <p className="mt-1 text-lg font-semibold text-[var(--color-foreground)] text-balance">
          {currentLabel}
        </p>
      </AcademicSectionAreaSummaryBand>

      <AcademicSectionAreaBlock
        id="section-learning-route-heading"
        title={dict.title}
        lead={dict.lead}
        icon={Route}
      >
        <AcademicSectionLearningRouteSelector
          locale={locale}
          cohortId={cohortId}
          sectionId={sectionId}
          routes={routes}
          assignment={assignment}
          dict={dict}
          embedded
        />
      </AcademicSectionAreaBlock>
    </div>
  );
}
