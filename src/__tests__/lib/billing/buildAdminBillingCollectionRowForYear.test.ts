import { describe, expect, it } from "vitest";
import { buildAdminBillingCollectionRowForYear } from "@/lib/billing/buildAdminBillingCollectionRowForYear";
import type { AdminBillingPaymentRow } from "@/types/adminStudentBilling";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

describe("buildAdminBillingCollectionRowForYear", () => {
  const planJan2026: SectionFeePlan = {
    id: "plan-1",
    sectionId: "sec-1",
    effectiveFromYear: 2026,
    effectiveFromMonth: 3,
    monthlyFee: 100,
    currency: "USD",
    archivedAt: null,
  };

  it("marks months before first fee-plan vigencia as no-plan (aligned with Cobranzas)", () => {
    const payments: AdminBillingPaymentRow[] = [];
    const row = buildAdminBillingCollectionRowForYear({
      sectionId: "sec-1",
      sectionName: "Section",
      cohortName: "Cohort",
      sectionStartsOn: "2026-01-01",
      sectionEndsOn: "2026-12-31",
      enrollmentCreatedAt: "2026-01-05T00:00:00Z",
      feePlans: [planJan2026],
      scheduleSlots: [],
      sectionEnrollmentFeeAmount: 0,
      enrollmentFeeExempt: true,
      enrollmentExemptReason: null,
      enrollmentId: "enr-1",
      enrollmentFeeReceiptStatus: null,
      enrollmentFeeReceiptSignedUrl: null,
      scholarships: [],
      payments,
      viewYear: 2026,
      calendarTodayYear: 2026,
      calendarTodayMonth: 6,
    });
    expect(row.cells[0]?.status).toBe("no-plan");
    expect(row.cells[2]?.status).toBe("due");
  });
});
