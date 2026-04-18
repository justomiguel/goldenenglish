import type { SectionFeePlan } from "@/types/sectionFeePlan";
import { periodIndex } from "@/lib/billing/scholarshipPeriod";

/**
 * Returns the section fee plan effective for (year, month): the plan with the
 * highest (effective_from_year, effective_from_month) that is <= (year, month).
 *
 * Plans must belong to the same section; the caller is responsible for that.
 * Returns null when no plan is in effect at the given period.
 */
export function resolveEffectiveSectionFeePlan(
  plans: readonly SectionFeePlan[],
  year: number,
  month: number,
): SectionFeePlan | null {
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const target = periodIndex(year, month);
  let best: SectionFeePlan | null = null;
  let bestIndex = -Infinity;
  for (const plan of plans) {
    const idx = periodIndex(plan.effectiveFromYear, plan.effectiveFromMonth);
    if (idx <= target && idx > bestIndex) {
      best = plan;
      bestIndex = idx;
    }
  }
  return best;
}

/**
 * True when (year, month) belongs to the contiguous payment window of the
 * given plan: starting at (period_start_year, period_start_month) and lasting
 * `payments_count` months (inclusive).
 */
export function isMonthInPlanPeriod(
  plan: SectionFeePlan,
  year: number,
  month: number,
): boolean {
  const start = periodIndex(plan.periodStartYear, plan.periodStartMonth);
  const end = start + plan.paymentsCount - 1;
  const target = periodIndex(year, month);
  return target >= start && target <= end;
}
