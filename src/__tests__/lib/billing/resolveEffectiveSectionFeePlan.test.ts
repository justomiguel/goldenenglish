import { describe, it, expect } from "vitest";
import {
  isMonthInPlanPeriod,
  resolveEffectiveSectionFeePlan,
} from "@/lib/billing/resolveEffectiveSectionFeePlan";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

const basePlan: SectionFeePlan = {
  id: "p1",
  sectionId: "sec",
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  paymentsCount: 10,
  chargesEnrollmentFee: false,
  periodStartYear: 2026,
  periodStartMonth: 3,
  archivedAt: null,
};

describe("resolveEffectiveSectionFeePlan", () => {
  it("returns null when no plans defined", () => {
    expect(resolveEffectiveSectionFeePlan([], 2026, 5)).toBeNull();
  });

  it("returns null when target is before any effective_from", () => {
    expect(resolveEffectiveSectionFeePlan([basePlan], 2025, 12)).toBeNull();
  });

  it("returns the only matching plan", () => {
    expect(resolveEffectiveSectionFeePlan([basePlan], 2026, 5)?.id).toBe("p1");
  });

  it("picks the most recent plan whose effective_from is <= target", () => {
    const newer: SectionFeePlan = {
      ...basePlan,
      id: "p2",
      effectiveFromMonth: 6,
      monthlyFee: 130,
    };
    const older: SectionFeePlan = { ...basePlan, id: "p1", monthlyFee: 100 };
    expect(resolveEffectiveSectionFeePlan([older, newer], 2026, 5)?.id).toBe("p1");
    expect(resolveEffectiveSectionFeePlan([older, newer], 2026, 6)?.id).toBe("p2");
    expect(resolveEffectiveSectionFeePlan([older, newer], 2027, 1)?.id).toBe("p2");
  });
});

describe("isMonthInPlanPeriod", () => {
  it("includes start and end months (inclusive)", () => {
    expect(isMonthInPlanPeriod(basePlan, 2026, 3)).toBe(true);
    expect(isMonthInPlanPeriod(basePlan, 2026, 12)).toBe(true);
  });

  it("excludes months before period_start", () => {
    expect(isMonthInPlanPeriod(basePlan, 2026, 2)).toBe(false);
  });

  it("excludes months past period_start + paymentsCount - 1", () => {
    expect(isMonthInPlanPeriod(basePlan, 2027, 1)).toBe(false);
  });

  it("supports periods that span more than one calendar year", () => {
    const plan: SectionFeePlan = {
      ...basePlan,
      periodStartYear: 2026,
      periodStartMonth: 9,
      paymentsCount: 10,
    };
    expect(isMonthInPlanPeriod(plan, 2026, 9)).toBe(true);
    expect(isMonthInPlanPeriod(plan, 2027, 6)).toBe(true);
    expect(isMonthInPlanPeriod(plan, 2027, 7)).toBe(false);
  });
});
