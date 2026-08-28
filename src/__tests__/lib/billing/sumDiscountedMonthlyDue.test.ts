import { describe, expect, it } from "vitest";
import {
  applyListDiscount,
  formatMonthlyDueTotals,
  monthlyDueLinesFromSectionBenefits,
  sumDiscountedMonthlyDue,
} from "@/lib/billing/sumDiscountedMonthlyDue";
import type { AdminStudentBillingSectionBenefit } from "@/types/adminStudentBilling";

describe("applyListDiscount", () => {
  it("applies a percent and rounds to cents", () => {
    expect(applyListDiscount(120, 25)).toBe(90);
    expect(applyListDiscount(100, 33)).toBe(67);
  });

  it("treats missing percent as the list price", () => {
    expect(applyListDiscount(80, null)).toBe(80);
  });
});

describe("sumDiscountedMonthlyDue", () => {
  it("sums discounted fees of the same currency and skips class packs", () => {
    expect(
      sumDiscountedMonthlyDue([
        { listAmount: 120, currency: "USD", discountPercent: 25 },
        { listAmount: 80, currency: "USD", discountPercent: null },
        { listAmount: 200, currency: "USD", discountPercent: 0, skip: true },
        { listAmount: null, currency: "USD", discountPercent: 10 },
      ]),
    ).toEqual([{ amount: 170, currency: "USD" }]);
  });

  it("keeps mixed currencies separate", () => {
    expect(
      sumDiscountedMonthlyDue([
        { listAmount: 10, currency: "USD", discountPercent: null },
        { listAmount: 5000, currency: "CLP", discountPercent: 50 },
      ]),
    ).toEqual([
      { amount: 2500, currency: "CLP" },
      { amount: 10, currency: "USD" },
    ]);
  });
});

describe("monthlyDueLinesFromSectionBenefits", () => {
  it("uses the current-month scholarship and skips class-pack sections", () => {
    const benefit = (partial: Partial<AdminStudentBillingSectionBenefit>): AdminStudentBillingSectionBenefit =>
      ({
        enrollmentId: "e",
        sectionId: "s",
        sectionName: "A",
        sectionEnrollmentFeeAmount: 0,
        sectionMonthlyFeeAmount: 100,
        sectionMonthlyFeeCurrency: "USD",
        sectionStartsOn: "2026-01-01",
        sectionEndsOn: "2026-12-31",
        enrollmentCreatedAt: null,
        enrollmentFeeExempt: false,
        enrollmentExemptReason: null,
        lastEnrollmentPaidAt: null,
        scholarships: [],
        enrollmentFeeReceiptSignedUrl: null,
        enrollmentFeeReceiptStatus: null,
        feePlans: [],
        scheduleSlots: [],
        cohortName: "",
        annualSettlements: [],
        ...partial,
      });

    const lines = monthlyDueLinesFromSectionBenefits(
      [
        benefit({
          scholarships: [
            {
              id: "sc",
              discount_percent: 50,
              note: null,
              valid_from_year: 2026,
              valid_from_month: 1,
              valid_until_year: 2026,
              valid_until_month: 12,
              is_active: true,
            },
          ],
        }),
        benefit({
          sectionId: "pack",
          sectionBillingMode: "class_pack",
          sectionMonthlyFeeAmount: 200,
        }),
      ],
      2026,
      8,
    );

    expect(sumDiscountedMonthlyDue(lines)).toEqual([{ amount: 50, currency: "USD" }]);
  });
});

describe("formatMonthlyDueTotals", () => {
  it("joins formatted amounts", () => {
    expect(formatMonthlyDueTotals([{ amount: 90, currency: "USD" }], "en")).toBe("$90");
  });
});
