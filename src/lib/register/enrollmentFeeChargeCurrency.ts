import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";

/** Use the institute currency when the snapshot still has the code default. */
export function enrollmentFeeChargeCurrency(
  snapshotCurrency: string,
  instituteCurrency: string,
): string {
  const snapshot = snapshotCurrency.trim().toUpperCase();
  const institute = instituteCurrency.trim().toUpperCase();
  if (
    snapshot === DEFAULT_SECTION_FEE_PLAN_CURRENCY &&
    institute &&
    institute !== snapshot
  ) {
    return institute;
  }
  return snapshot || institute || DEFAULT_SECTION_FEE_PLAN_CURRENCY;
}
