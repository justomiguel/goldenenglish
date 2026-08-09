import type { SectionFeePlan } from "@/types/sectionFeePlan";
import { pickEffectiveForPeriod } from "@/lib/billing/pickEffectiveForPeriod";

/**
 * Returns the section fee plan effective for (year, month): the plan with the
 * highest (effective_from_year, effective_from_month) that is <= (year, month).
 *
 * Plans must belong to the same section; the caller is responsible for that.
 * Returns null when no plan is in effect at the given period.
 *
 * The window comparison lives in `pickEffectiveForPeriod` so the class-pack price catalog selects its
 * effective tier with the same rule. A section has at most one plan per window (unique index in
 * migration 055), hence the first element.
 */
export function resolveEffectiveSectionFeePlan(
  plans: readonly SectionFeePlan[],
  year: number,
  month: number,
): SectionFeePlan | null {
  const effective = pickEffectiveForPeriod(plans, { year, month }, (plan) => ({
    year: plan.effectiveFromYear,
    month: plan.effectiveFromMonth,
  }));
  return effective[0] ?? null;
}
