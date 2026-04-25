import { aggregateCohortCollectionsTotals } from "@/lib/billing/aggregateCohortCollectionsTotals";
import type {
  CohortCollectionsMatrix,
  CohortCollectionsMatrixSection,
} from "@/types/cohortCollectionsMatrix";
import type { SectionCollectionsView } from "@/types/sectionCollections";

export interface CohortCollectionsViewSource {
  view: SectionCollectionsView;
  archivedAt: string | null;
}

export function buildCohortCollectionsMatrixFromViews(input: {
  cohortId: string;
  cohortName: string;
  year: number;
  todayMonth: number;
  sections: readonly CohortCollectionsViewSource[];
}): CohortCollectionsMatrix {
  const sections: CohortCollectionsMatrixSection[] = input.sections.map((s) => ({
    view: s.view,
    archivedAt: s.archivedAt,
  }));

  return {
    cohortId: input.cohortId,
    cohortName: input.cohortName,
    year: input.year,
    todayMonth: input.todayMonth,
    sections,
    totals: aggregateCohortCollectionsTotals(sections),
  };
}
