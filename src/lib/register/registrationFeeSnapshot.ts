import { resolveEffectiveEnrollmentFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";

export type RegistrationFeeMode = "once_for_all" | "per_section";

export type RegistrationFeeLine = {
  sectionId: string;
  sectionName: string;
  amount: number;
};

export type RegistrationFeeSnapshot = {
  mode: RegistrationFeeMode;
  currency: string;
  total: number;
  lines: RegistrationFeeLine[];
  capturedAt: string;
};

export type RegistrationFeeSectionInput = {
  id: string;
  name: string;
  sectionAmount: number | null;
  cohortDefault: number | null;
};

export function canCohortUseOnceForAll(effectiveAmounts: number[]): boolean {
  if (effectiveAmounts.length <= 1) return true;
  return effectiveAmounts.every((n) => n === effectiveAmounts[0]);
}

export function buildRegistrationFeeSnapshot(input: {
  mode: RegistrationFeeMode;
  currency?: string;
  nowIso: string;
  sections: RegistrationFeeSectionInput[];
  alreadyCoveredSectionIds?: string[];
  onceForAllAlreadyCovered?: boolean;
  sharedAmount?: number;
}): RegistrationFeeSnapshot {
  const covered = new Set(input.alreadyCoveredSectionIds ?? []);
  const currencyFallback = input.currency?.trim() || DEFAULT_SECTION_FEE_PLAN_CURRENCY;

  if (input.sections.length === 0) {
    const total =
      input.mode === "once_for_all" && !input.onceForAllAlreadyCovered
        ? Number(input.sharedAmount ?? 0)
        : 0;
    return {
      mode: input.mode,
      currency: currencyFallback,
      total,
      lines: [],
      capturedAt: input.nowIso,
    };
  }

  if (input.mode === "once_for_all") {
    const lines: RegistrationFeeLine[] = input.sections.map((section, index) => {
      const effective = resolveEffectiveEnrollmentFeeAmount(
        section.sectionAmount,
        section.cohortDefault,
      );
      const amount =
        input.onceForAllAlreadyCovered || index > 0 ? 0 : effective;
      return { sectionId: section.id, sectionName: section.name, amount };
    });
    return {
      mode: input.mode,
      currency: firstChargedCurrency(lines, currencyFallback),
      total: lines.reduce((sum, line) => sum + line.amount, 0),
      lines,
      capturedAt: input.nowIso,
    };
  }

  const lines: RegistrationFeeLine[] = input.sections
    .filter((section) => !covered.has(section.id))
    .map((section) => ({
      sectionId: section.id,
      sectionName: section.name,
      amount: resolveEffectiveEnrollmentFeeAmount(
        section.sectionAmount,
        section.cohortDefault,
      ),
    }));
  return {
    mode: input.mode,
    currency: firstChargedCurrency(lines, currencyFallback),
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    lines,
    capturedAt: input.nowIso,
  };
}

function firstChargedCurrency(
  lines: RegistrationFeeLine[],
  fallback: string,
): string {
  return lines.some((line) => line.amount > 0) ? fallback : fallback;
}
