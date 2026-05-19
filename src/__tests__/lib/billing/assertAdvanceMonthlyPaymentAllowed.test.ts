import { describe, expect, it } from "vitest";
import { isAdvanceMonthlyPaymentAllowedForCell } from "@/lib/billing/assertAdvanceMonthlyPaymentAllowed";

describe("isAdvanceMonthlyPaymentAllowedForCell", () => {
  it("allows current and past months regardless of flag", () => {
    expect(
      isAdvanceMonthlyPaymentAllowedForCell(false, 2026, 4, 2026, 5),
    ).toBe(true);
  });

  it("blocks future months when section flag is off", () => {
    expect(
      isAdvanceMonthlyPaymentAllowedForCell(false, 2026, 8, 2026, 5),
    ).toBe(false);
  });

  it("allows future months when section flag is on", () => {
    expect(
      isAdvanceMonthlyPaymentAllowedForCell(true, 2026, 8, 2026, 5),
    ).toBe(true);
  });
});
