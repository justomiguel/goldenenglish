import {
  isMonthInPlanPeriod,
  resolveEffectiveSectionFeePlan,
} from "@/lib/billing/resolveEffectiveSectionFeePlan";
import type { SectionFeePlan, SectionFeePlanWithUsage } from "@/types/sectionFeePlan";

export interface SectionFeePlanPaymentRef {
  year: number;
  month: number;
}

/**
 * Returns the set of plan ids that have at least one payment row mapped to
 * their effective window for the given section.
 *
 * A plan is considered "in use" when at least one payment falls in:
 *   - the plan's effective range (it is the most recent plan with
 *     `effective_from <= (year, month)`), AND
 *   - the plan's own period coverage (`period_start..period_start+payments_count-1`).
 *
 * Archived plans are still scored: archived doesn't erase history. The caller
 * decides what to do with the result (e.g. block hard delete).
 */
export function computeSectionFeePlansInUseIds(
  plans: readonly SectionFeePlan[],
  payments: readonly SectionFeePlanPaymentRef[],
): Set<string> {
  const inUse = new Set<string>();
  if (plans.length === 0 || payments.length === 0) return inUse;
  for (const payment of payments) {
    const effective = resolveEffectiveSectionFeePlan(plans, payment.year, payment.month);
    if (!effective) continue;
    if (!isMonthInPlanPeriod(effective, payment.year, payment.month)) continue;
    inUse.add(effective.id);
  }
  return inUse;
}

export function attachSectionFeePlansUsage(
  plans: readonly SectionFeePlan[],
  payments: readonly SectionFeePlanPaymentRef[],
): SectionFeePlanWithUsage[] {
  const inUseIds = computeSectionFeePlansInUseIds(plans, payments);
  return plans.map((p) => ({ ...p, inUse: inUseIds.has(p.id) }));
}
