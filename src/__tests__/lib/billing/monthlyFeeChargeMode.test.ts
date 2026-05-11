import { describe, expect, it } from "vitest";
import { parseMonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";

describe("parseMonthlyFeeChargeMode", () => {
  it("defaults unknown values to prorate_by_classes", () => {
    expect(parseMonthlyFeeChargeMode(undefined)).toBe("prorate_by_classes");
    expect(parseMonthlyFeeChargeMode(null)).toBe("prorate_by_classes");
    expect(parseMonthlyFeeChargeMode("")).toBe("prorate_by_classes");
    expect(parseMonthlyFeeChargeMode("bogus")).toBe("prorate_by_classes");
  });

  it("accepts full_month_fee", () => {
    expect(parseMonthlyFeeChargeMode("full_month_fee")).toBe("full_month_fee");
  });
});
