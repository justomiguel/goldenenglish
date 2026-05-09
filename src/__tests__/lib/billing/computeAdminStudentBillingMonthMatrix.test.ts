import { describe, expect, it } from "vitest";
import { computeAdminStudentBillingMonthMatrix } from "@/lib/billing/computeAdminStudentBillingMonthMatrix";
import type { AdminStudentBillingSectionBenefit } from "@/types/adminStudentBilling";

describe("computeAdminStudentBillingMonthMatrix", () => {
  const benefit: AdminStudentBillingSectionBenefit = {
    enrollmentId: "enr-1",
    sectionId: "sec-1",
    sectionName: "Section",
    sectionEnrollmentFeeAmount: 0,
    sectionMonthlyFeeAmount: 100,
    sectionMonthlyFeeCurrency: "USD",
    sectionStartsOn: "2026-01-01",
    sectionEndsOn: "2026-12-31",
    enrollmentCreatedAt: "2026-01-05T00:00:00Z",
    enrollmentFeeExempt: true,
    enrollmentExemptReason: null,
    lastEnrollmentPaidAt: null,
    scholarships: [],
    enrollmentFeeReceiptSignedUrl: null,
    enrollmentFeeReceiptStatus: null,
    feePlans: [
      {
        id: "plan-1",
        sectionId: "sec-1",
        effectiveFromYear: 2026,
        effectiveFromMonth: 3,
        monthlyFee: 100,
        currency: "USD",
        archivedAt: null,
      },
    ],
    scheduleSlots: [],
    cohortName: "Cohort A",
    annualSettlements: [],
  };

  it("returns merged monthStates and collectionCells", () => {
    const r = computeAdminStudentBillingMonthMatrix({
      benefit,
      payments: [],
      scholarships: [],
      billingYear: 2026,
      calendarTodayYear: 2026,
      calendarTodayMonth: 6,
    });
    expect(r.collectionCells).not.toBeNull();
    expect(r.collectionCells?.[0]?.status).toBe("no-plan");
    expect(r.monthStates[0]?.selectable).toBe(false);
  });

  it("suppresses scholarship percent in the grid for months covered by an annual settlement", () => {
    const schol = {
      id: "sch-1",
      discount_percent: 40,
      note: null as string | null,
      valid_from_year: 2026,
      valid_from_month: 1,
      valid_until_year: 2026,
      valid_until_month: 12,
      is_active: true,
    };
    const benefitWithSettlement: AdminStudentBillingSectionBenefit = {
      ...benefit,
      annualSettlements: [
        {
          id: "set-1",
          coverageFromYear: 2026,
          coverageFromMonth: 1,
          coverageUntilYear: 2026,
          coverageUntilMonth: 12,
          includesEnrollmentFee: false,
          baselineListTotal: 100,
          acceptedTotal: 90,
          impliedDiscountAmount: 10,
          currency: "USD",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const r = computeAdminStudentBillingMonthMatrix({
      benefit: benefitWithSettlement,
      payments: [],
      scholarships: [schol],
      billingYear: 2026,
      calendarTodayYear: 2026,
      calendarTodayMonth: 6,
    });
    expect(r.monthStates[5]?.scholarshipPercent).toBeNull();
  });
});
