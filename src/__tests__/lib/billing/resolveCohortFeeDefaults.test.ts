/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  parseOptionalFeeAmount,
  resolveEffectiveEnrollmentFeeAmount,
  resolveEffectiveMonthlyFee,
} from "@/lib/billing/resolveCohortFeeDefaults";

describe("parseOptionalFeeAmount", () => {
  it("returns null for empty, null, and invalid values", () => {
    expect(parseOptionalFeeAmount(null)).toBeNull();
    expect(parseOptionalFeeAmount(undefined)).toBeNull();
    expect(parseOptionalFeeAmount("")).toBeNull();
    expect(parseOptionalFeeAmount("  ")).toBeNull();
    expect(parseOptionalFeeAmount("abc")).toBeNull();
    expect(parseOptionalFeeAmount(-1)).toBeNull();
    expect(parseOptionalFeeAmount(Number.NaN)).toBeNull();
  });

  it("parses zero and positive numbers including numeric strings", () => {
    expect(parseOptionalFeeAmount(0)).toBe(0);
    expect(parseOptionalFeeAmount("0")).toBe(0);
    expect(parseOptionalFeeAmount(150.5)).toBe(150.5);
    expect(parseOptionalFeeAmount("80")).toBe(80);
  });
});

describe("resolveEffectiveEnrollmentFeeAmount", () => {
  it("uses the section amount when it is set, including 0", () => {
    expect(resolveEffectiveEnrollmentFeeAmount(0, 200)).toBe(0);
    expect(resolveEffectiveEnrollmentFeeAmount(80, 200)).toBe(80);
  });

  it("inherits the cohort default when the section amount is null", () => {
    expect(resolveEffectiveEnrollmentFeeAmount(null, 200)).toBe(200);
    expect(resolveEffectiveEnrollmentFeeAmount(null, 0)).toBe(0);
  });

  it("returns 0 when both the section and the cohort have no amount", () => {
    expect(resolveEffectiveEnrollmentFeeAmount(null, null)).toBe(0);
  });
});

describe("resolveEffectiveMonthlyFee", () => {
  it("returns class_pack before looking at plans or defaults", () => {
    expect(
      resolveEffectiveMonthlyFee({
        billingMode: "class_pack",
        sectionPlan: { monthlyFee: 90, currency: "CLP" },
        cohortDefaultMonthlyFee: 50,
      }),
    ).toEqual({ kind: "class_pack" });
  });

  it("uses the section plan when one is in effect", () => {
    expect(
      resolveEffectiveMonthlyFee({
        billingMode: "section_monthly_fee",
        sectionPlan: { monthlyFee: 90, currency: "CLP" },
        cohortDefaultMonthlyFee: 50,
      }),
    ).toEqual({ kind: "section", monthlyFee: 90, currency: "CLP" });
  });

  it("uses a USD virtual cohort plan when there is no section plan", () => {
    expect(
      resolveEffectiveMonthlyFee({
        billingMode: "section_monthly_fee",
        sectionPlan: null,
        cohortDefaultMonthlyFee: 50,
      }),
    ).toEqual({ kind: "cohort", monthlyFee: 50, currency: "USD" });
  });

  it("returns none when there is no plan and no cohort default", () => {
    expect(
      resolveEffectiveMonthlyFee({
        billingMode: null,
        sectionPlan: null,
        cohortDefaultMonthlyFee: null,
      }),
    ).toEqual({ kind: "none" });
  });
});
