import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import type { CohortCollectionsMatrix } from "@/types/cohortCollectionsMatrix";
import { deriveMonthlyCollectionTrend } from "@/lib/billing/deriveMonthlyCollectionTrend";
import { computeFinanceProjection } from "@/lib/billing/computeFinanceProjection";
import { rankSectionsByHealth } from "@/lib/billing/rankSectionsByHealth";
import { loadFinanceReceiptProcessingStats } from "@/lib/billing/loadFinanceReceiptProcessingStats";
import { FinanceInsightsClient } from "./FinanceInsightsClient";

export interface FinanceInsightsPanelProps {
  matrix: CohortCollectionsMatrix | null;
  cohortId: string | null;
  supabase: SupabaseClient;
  locale: string;
  dict: Dictionary["admin"]["finance"];
}

export async function FinanceInsightsPanel({
  matrix,
  cohortId,
  supabase,
  locale,
  dict,
}: FinanceInsightsPanelProps) {
  if (!matrix || !cohortId) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        {dict.collections.errors.loadFailed}
      </p>
    );
  }

  const trend = deriveMonthlyCollectionTrend(
    matrix.sections,
    matrix.year,
    matrix.todayMonth,
  );
  const projection = computeFinanceProjection(
    trend,
    matrix.totals,
    matrix.todayMonth,
  );
  const ranked = rankSectionsByHealth(matrix.sections);
  const processingStats = await loadFinanceReceiptProcessingStats(
    supabase,
    cohortId,
    matrix.year,
  );

  return (
    <FinanceInsightsClient
      trend={trend}
      projection={projection}
      ranked={ranked}
      processingStats={processingStats}
      cohortName={matrix.cohortName}
      locale={locale}
      dict={dict.insights}
    />
  );
}
