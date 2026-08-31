/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { firstClassPackTuition } from "@/lib/billing/firstClassPackTuition";
import type { ClassPackPrice } from "@/types/classPack";

function tier(classCount: number, amount: number): ClassPackPrice {
  return {
    id: `p-${classCount}`,
    effectiveFromYear: 2026,
    effectiveFromMonth: 1,
    classCount,
    amount,
    currency: "CLP",
    archivedAt: null,
  };
}

describe("firstClassPackTuition", () => {
  it("picks the cheapest current tier as the first-pack charge", () => {
    expect(firstClassPackTuition([tier(8, 50000), tier(4, 40000), tier(12, 60000)], 2026, 3)).toEqual({
      amount: 40000,
      currency: "CLP",
      classCount: 4,
      priceId: "p-4",
    });
  });

  it("returns null when the catalog has no current tier", () => {
    expect(firstClassPackTuition([], 2026, 3)).toBeNull();
  });
});
