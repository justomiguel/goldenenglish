// REGRESSION CHECK: Fees hub summary must pick the non-archived plan in effect
// for the institute month; archived / future-only plans must not win.
import { describe, expect, it } from "vitest";
import { resolveSectionFeesSummaryPlan } from "@/lib/billing/resolveSectionFeesSummaryPlan";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

function plan(
  partial: Pick<SectionFeePlan, "id" | "effectiveFromYear" | "effectiveFromMonth"> &
    Partial<SectionFeePlan>,
): SectionFeePlan {
  return {
    sectionId: "s1",
    monthlyFee: 100,
    currency: "USD",
    archivedAt: null,
    ...partial,
  };
}

describe("resolveSectionFeesSummaryPlan", () => {
  it("returns null when there are no plans", () => {
    expect(resolveSectionFeesSummaryPlan([], 2026, 7)).toBeNull();
  });

  it("ignores archived plans", () => {
    const plans = [
      plan({
        id: "a",
        effectiveFromYear: 2026,
        effectiveFromMonth: 1,
        archivedAt: "2026-01-01T00:00:00Z",
      }),
    ];
    expect(resolveSectionFeesSummaryPlan(plans, 2026, 7)).toBeNull();
  });

  it("picks the latest non-archived plan effective on or before the month", () => {
    const plans = [
      plan({ id: "old", effectiveFromYear: 2026, effectiveFromMonth: 1, monthlyFee: 80 }),
      plan({ id: "cur", effectiveFromYear: 2026, effectiveFromMonth: 6, monthlyFee: 120 }),
      plan({ id: "future", effectiveFromYear: 2026, effectiveFromMonth: 9, monthlyFee: 150 }),
    ];
    const resolved = resolveSectionFeesSummaryPlan(plans, 2026, 7);
    expect(resolved?.id).toBe("cur");
    expect(resolved?.monthlyFee).toBe(120);
  });
});
