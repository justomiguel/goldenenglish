import { describe, expect, it } from "vitest";
import { computeAnnualTuitionSettlementAllocations } from "@/lib/billing/computeAnnualTuitionSettlementAllocations";

describe("computeAnnualTuitionSettlementAllocations", () => {
  const months = [
    { year: 2026, month: 1, listAmount: 100 },
    { year: 2026, month: 2, listAmount: 100 },
  ];

  it("splits tuition pool proportionally and computes implied discount", () => {
    const r = computeAnnualTuitionSettlementAllocations({
      billableMonths: months,
      enrollmentFeeList: 0,
      includesEnrollmentFee: false,
      acceptedTotal: 180,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.baselineListTotal).toBe(200);
    expect(r.impliedDiscountAmount).toBe(20);
    expect(r.months.map((m) => m.amount).reduce((a, b) => a + b, 0)).toBe(180);
  });

  it("reserves list enrollment fee from accepted total when included", () => {
    const r = computeAnnualTuitionSettlementAllocations({
      billableMonths: months,
      enrollmentFeeList: 50,
      includesEnrollmentFee: true,
      acceptedTotal: 210,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.baselineListTotal).toBe(250);
    expect(r.tuitionPool).toBe(160);
    expect(r.months.map((m) => m.amount).reduce((a, b) => a + b, 0)).toBe(160);
  });

  it("rejects accepted total above baseline", () => {
    const r = computeAnnualTuitionSettlementAllocations({
      billableMonths: months,
      enrollmentFeeList: 0,
      includesEnrollmentFee: false,
      acceptedTotal: 250,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("accepted_exceeds_baseline");
  });
});
