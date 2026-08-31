import type { ParentMonthlyPayScope } from "@/lib/billing/listPayableParentMonthSections";

/**
 * When the institute turns off partial section payments, the parent must pay
 * every payable section for that month. A single payable section stays "current".
 */
export function resolveParentMonthlyPayScope(input: {
  requested: ParentMonthlyPayScope;
  allowPartial: boolean;
  payableSectionCount: number;
}): ParentMonthlyPayScope {
  if (!input.allowPartial && input.payableSectionCount >= 2) return "all";
  return input.requested;
}
