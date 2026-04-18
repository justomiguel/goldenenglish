import { describe, it, expect } from "vitest";
import { getBillingTerms } from "@/lib/billing/getBillingTerms";

describe("getBillingTerms", () => {
  it("returns billing copy for English", () => {
    const t = getBillingTerms("en");
    expect(t.enrollment.length).toBeGreaterThan(0);
    expect(t.monthly.length).toBeGreaterThan(0);
    expect(t.promotion.length).toBeGreaterThan(0);
  });

  it("returns billing copy for Spanish", () => {
    const t = getBillingTerms("es");
    expect(t.enrollment.length).toBeGreaterThan(0);
    expect(t.monthly.length).toBeGreaterThan(0);
    expect(t.promotion.length).toBeGreaterThan(0);
  });
});
