import type { SectionFeePlan } from "@/types/sectionFeePlan";
import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";

/**
 * Active monthly fee plan for the Fees area summary: non-archived plans only,
 * then the same effective-date rule as billing (`resolveEffectiveSectionFeePlan`).
 */
export function resolveSectionFeesSummaryPlan(
  plans: readonly SectionFeePlan[],
  year: number,
  month: number,
): SectionFeePlan | null {
  const active = plans.filter((p) => !p.archivedAt);
  return resolveEffectiveSectionFeePlan(active, year, month);
}
