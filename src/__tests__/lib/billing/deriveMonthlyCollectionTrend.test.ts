import { describe, expect, it } from "vitest";
import { deriveMonthlyCollectionTrend } from "@/lib/billing/deriveMonthlyCollectionTrend";
import type { CohortCollectionsMatrixSection } from "@/types/cohortCollectionsMatrix";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

function makeCell(
  month: number,
  status: StudentMonthlyPaymentCell["status"],
  opts?: { expectedAmount?: number; recordedAmount?: number },
): StudentMonthlyPaymentCell {
  return {
    month,
    year: 2026,
    status,
    expectedAmount: opts?.expectedAmount ?? 100,
    recordedAmount: opts?.recordedAmount ?? null,
    fullMonthExpectedAmount: opts?.expectedAmount ?? 100,
    currency: "USD",
    proration: null,
    paymentId: null,
    receiptSignedUrl: null,
    isCurrent: false,
  };
}

function makeSection(
  cells: StudentMonthlyPaymentCell[],
): CohortCollectionsMatrixSection {
  return {
    archivedAt: null,
    view: {
      sectionId: "sec-1",
      sectionName: "Section A",
      cohortId: "coh-1",
      cohortName: "Cohort 1",
      year: 2026,
      todayMonth: 4,
      sectionStartsOn: "2026-01-15",
      sectionEndsOn: "2026-12-15",
      students: [
        {
          studentId: "stu-1",
          studentName: "Student One",
          documentLabel: null,
          enrolledAt: null,
          row: { sectionId: "sec-1", sectionName: "Section A", cohortName: "Cohort 1", hasActivePlan: true, enrollmentFeeAmount: 0, enrollmentFeeExempt: false, enrollmentFeeExemptReason: null, enrollmentFeeCurrency: "USD", cells, currentPlan: null, enrollmentId: null, enrollmentFeeReceiptStatus: null, enrollmentFeeReceiptSignedUrl: null },
          paid: 0,
          pendingReview: 0,
          overdue: 0,
          upcoming: 0,
          expectedYear: 0,
          hasOverdue: false,
          enrollmentFee: { amount: 0, expectedAmount: 0, exempt: false, exemptReason: null },
          scholarships: [],
          activeScholarshipDiscountPercent: null,
          activePromotionLabel: null,
        },
      ],
      kpis: { paid: 0, pendingReview: 0, overdue: 0, upcoming: 0, expectedYear: 0, collectionRatio: 0, totalStudents: 0, overdueStudents: 0, health: "watch" },
    },
  };
}

describe("deriveMonthlyCollectionTrend", () => {
  it("returns 12 entries for all months", () => {
    const result = deriveMonthlyCollectionTrend([], 2026, 4);
    expect(result).toHaveLength(12);
    expect(result[0]!.month).toBe(1);
    expect(result[11]!.month).toBe(12);
  });

  it("groups approved cells into collected bucket", () => {
    const sec = makeSection([
      makeCell(1, "approved", { recordedAmount: 80 }),
      makeCell(2, "approved", { recordedAmount: 100 }),
    ]);
    const trend = deriveMonthlyCollectionTrend([sec], 2026, 4);
    expect(trend[0]!.collected).toBe(80);
    expect(trend[1]!.collected).toBe(100);
  });

  it("groups pending cells into pending bucket", () => {
    const sec = makeSection([makeCell(3, "pending", { recordedAmount: 50 })]);
    const trend = deriveMonthlyCollectionTrend([sec], 2026, 4);
    expect(trend[2]!.pending).toBe(50);
  });

  it("places due before today in overdue, after today in upcoming", () => {
    const sec = makeSection([
      makeCell(1, "due"),
      makeCell(6, "due"),
    ]);
    const trend = deriveMonthlyCollectionTrend([sec], 2026, 4);
    expect(trend[0]!.overdue).toBe(100);
    expect(trend[5]!.upcoming).toBe(100);
  });

  it("computes ratio as collected / expected", () => {
    const sec = makeSection([
      makeCell(1, "approved", { expectedAmount: 200, recordedAmount: 100 }),
    ]);
    const trend = deriveMonthlyCollectionTrend([sec], 2026, 4);
    expect(trend[0]!.ratio).toBe(0.5);
  });

  it("ignores exempt and out-of-period cells in expected totals", () => {
    const sec = makeSection([
      makeCell(1, "exempt"),
      makeCell(2, "out-of-period"),
    ]);
    const trend = deriveMonthlyCollectionTrend([sec], 2026, 4);
    expect(trend[0]!.expected).toBe(0);
    expect(trend[1]!.expected).toBe(0);
  });

  it("returns zero ratio when expected is 0", () => {
    const trend = deriveMonthlyCollectionTrend([], 2026, 4);
    expect(trend[0]!.ratio).toBe(0);
  });
});
