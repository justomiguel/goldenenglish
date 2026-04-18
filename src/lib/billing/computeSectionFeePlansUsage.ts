import { resolveEffectiveSectionFeePlan } from "@/lib/billing/resolveEffectiveSectionFeePlan";
import type { SectionFeePlan, SectionFeePlanWithUsage } from "@/types/sectionFeePlan";

export interface SectionFeePlanPaymentRef {
  year: number;
  month: number;
}

/**
 * Returns the set of plan ids that have at least one payment row attributed
 * to them through the effective-from rule (most recent plan with
 * `effective_from <= (year, month)`).
 *
 * Archived plans are still scored: archiving doesn't erase history. The caller
 * decides what to do with the result (e.g. block hard delete).
 *
 * Note: with the simplified model (no `payments_count` / `period_start_*`),
 * the temporal scope of a section is owned by `academic_sections`. We only
 * need the effective-from chain to attribute payments to their plan.
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
