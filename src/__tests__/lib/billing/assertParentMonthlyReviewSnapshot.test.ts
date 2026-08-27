/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { assertParentMonthlyReviewSnapshot } from "@/lib/billing/assertParentMonthlyReviewSnapshot";

describe("assertParentMonthlyReviewSnapshot", () => {
  it("accepts the same total in CLP after rounding", () => {
    expect(
      assertParentMonthlyReviewSnapshot({
        computedTotal: 1000.4,
        submittedTotal: 1000,
        currency: "CLP",
      }),
    ).toBe(true);
  });

  it("rejects a stale total", () => {
    expect(
      assertParentMonthlyReviewSnapshot({
        computedTotal: 210,
        submittedTotal: 120,
        currency: "CLP",
      }),
    ).toBe(false);
  });
});
