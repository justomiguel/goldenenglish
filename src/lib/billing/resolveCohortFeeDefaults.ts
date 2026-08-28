import { sectionIsClassPackBilled } from "@/lib/billing/sectionBillingMode";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";

export function parseOptionalFeeAmount(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "string" && raw.trim() === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function resolveEffectiveEnrollmentFeeAmount(
  sectionAmount: number | null,
  cohortDefault: number | null,
): number {
  if (sectionAmount != null) return sectionAmount;
  if (cohortDefault != null) return cohortDefault;
  return 0;
}

export type SectionPlanFee = {
  monthlyFee: number;
  currency: string;
};

export type EffectiveMonthlyFee =
  | { kind: "class_pack" }
  | { kind: "section"; monthlyFee: number; currency: string }
  | { kind: "cohort"; monthlyFee: number; currency: string }
  | { kind: "none" };

export function resolveEffectiveMonthlyFee(input: {
  billingMode: string | null | undefined;
  sectionPlan: SectionPlanFee | null;
  cohortDefaultMonthlyFee: number | null;
}): EffectiveMonthlyFee {
  if (sectionIsClassPackBilled(input.billingMode)) {
    return { kind: "class_pack" };
  }
  if (input.sectionPlan) {
    return {
      kind: "section",
      monthlyFee: input.sectionPlan.monthlyFee,
      currency: input.sectionPlan.currency,
    };
  }
  if (input.cohortDefaultMonthlyFee != null) {
    return {
      kind: "cohort",
      monthlyFee: input.cohortDefaultMonthlyFee,
      currency: DEFAULT_SECTION_FEE_PLAN_CURRENCY,
    };
  }
  return { kind: "none" };
}
