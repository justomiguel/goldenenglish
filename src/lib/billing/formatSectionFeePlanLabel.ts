import type { SectionFeePlan } from "@/types/sectionFeePlan";

/** Labels for the effective-from prefix (dictionary `feePlans.effectiveFromShort`). */
export interface FormatSectionFeePlanLabelCopy {
  effectiveFromShort: string;
}

/** Pure label: `From MM/YYYY · CUR amount` — safe for RSC and client. */
export function formatSectionFeePlanLabel(
  p: SectionFeePlan,
  dict: FormatSectionFeePlanLabelCopy,
): string {
  const eff = `${String(p.effectiveFromMonth).padStart(2, "0")}/${p.effectiveFromYear}`;
  const amount = `${p.currency} ${p.monthlyFee.toFixed(2)}`;
  return `${dict.effectiveFromShort} ${eff} · ${amount}`;
}
