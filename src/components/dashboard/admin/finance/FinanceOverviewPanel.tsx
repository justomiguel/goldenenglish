import "server-only";
import type { Dictionary } from "@/types/i18n";
import type { CohortCollectionsMatrix } from "@/types/cohortCollectionsMatrix";
import type { CohortCollectionsOverview } from "@/types/sectionCollections";
import { CohortCollectionsOverviewBoard } from "./CohortCollectionsOverviewBoard";
import { FinanceTopDebtorsCard } from "./FinanceTopDebtorsCard";

function matrixToOverview(
  matrix: CohortCollectionsMatrix,
): CohortCollectionsOverview {
  return {
    cohortId: matrix.cohortId,
    cohortName: matrix.cohortName,
    year: matrix.year,
    totals: matrix.totals,
    sections: matrix.sections.map((s) => ({
      sectionId: s.view.sectionId,
      sectionName: s.view.sectionName,
      archivedAt: s.archivedAt,
      kpis: s.view.kpis,
    })),
  };
}

export interface FinanceOverviewPanelProps {
  matrix: CohortCollectionsMatrix | null;
  cohortName: string | null;
  locale: string;
  dict: Dictionary["admin"]["finance"];
  sectionDrillBaseHref: string;
  currency: string;
}

export function FinanceOverviewPanel({
  matrix,
  cohortName,
  locale,
  dict,
  sectionDrillBaseHref,
  currency,
}: FinanceOverviewPanelProps) {
  const overviewDict = dict.overview;
  const collectionsDict = dict.collections;

  if (!cohortName) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        {overviewDict.empty.noCurrentCohort}
      </p>
    );
  }

  if (!matrix) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        {collectionsDict.errors.loadFailed}
      </p>
    );
  }

  const overview = matrixToOverview(matrix);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
          {overviewDict.title}
          <span className="ml-2 text-sm font-normal text-[var(--color-muted-foreground)]">
            — {cohortName}
          </span>
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {overviewDict.lead}
        </p>
      </header>

      <CohortCollectionsOverviewBoard
        overview={overview}
        dict={collectionsDict}
        locale={locale}
        baseHref={sectionDrillBaseHref}
        currency={currency}
      />

      <FinanceTopDebtorsCard
        sections={matrix.sections}
        dict={overviewDict.topDebtors}
        locale={locale}
        currency={currency}
      />
    </div>
  );
}
