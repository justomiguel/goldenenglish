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
});
