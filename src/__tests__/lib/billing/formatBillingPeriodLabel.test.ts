import { describe, expect, it } from "vitest";
import { formatBillingPeriodLabel } from "@/lib/billing/formatBillingPeriodLabel";

describe("formatBillingPeriodLabel", () => {
  it("formats May 2026 in English", () => {
    expect(formatBillingPeriodLabel("en", 2026, 5)).toMatch(/may/i);
    expect(formatBillingPeriodLabel("en-US", 2026, 5)).toMatch(/2026/);
  });

  it("formats Spanish month+year", () => {
    const s = formatBillingPeriodLabel("es", 2026, 5);
    expect(s).toMatch(/mayo/i);
    expect(s).toMatch(/2026/);
  });

  it("handles invalid year with fallback fragment", () => {
    expect(formatBillingPeriodLabel("es", NaN as unknown as number, 5)).toBe("5/NaN");
  });
});
