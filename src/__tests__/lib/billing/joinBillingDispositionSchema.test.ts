/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { joinBillingDispositionSchema } from "@/lib/billing/joinBillingDispositionSchema";

// REGRESSION CHECK: Accept must reject a missing or incomplete disposition so
// mid-year joins cannot slip through as unpaid plan-year debt.

describe("joinBillingDispositionSchema", () => {
  it("accepts current and behind without extras", () => {
    expect(joinBillingDispositionSchema.parse({ kind: "current" })).toEqual({ kind: "current" });
    expect(joinBillingDispositionSchema.parse({ kind: "behind" })).toEqual({ kind: "behind" });
  });

  it("requires percent 1–100 and a scope for scholarship", () => {
    expect(
      joinBillingDispositionSchema.parse({
        kind: "scholarship",
        percent: 50,
        scope: "rest_of_cycle",
      }),
    ).toEqual({ kind: "scholarship", percent: 50, scope: "rest_of_cycle" });
    expect(joinBillingDispositionSchema.safeParse({ kind: "scholarship" }).success).toBe(false);
    expect(
      joinBillingDispositionSchema.safeParse({
        kind: "scholarship",
        percent: 0,
        scope: "join_month",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing kind", () => {
    expect(joinBillingDispositionSchema.safeParse({}).success).toBe(false);
  });
});
