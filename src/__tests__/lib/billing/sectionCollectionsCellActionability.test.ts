// REGRESSION CHECK: Paid cells with paymentId are revert-selectable; unpaid stay record-selectable.
import { describe, expect, it } from "vitest";
import {
  isSectionCollectionsMonthlyCellRecordSelectable,
  isSectionCollectionsMonthlyCellRevertSelectable,
  sectionCollectionsCellActionMode,
} from "@/lib/billing/sectionCollectionsCellActionability";
import type { SectionCollectionsStudentRow } from "@/types/sectionCollections";

function cell(
  month: number,
  status: "approved" | "due" | "exempt",
  paymentId: string | null = null,
) {
  return {
    month,
    year: 2026,
    status,
    expectedAmount: 100,
    fullMonthExpectedAmount: 100,
    currency: "USD",
    proration: null,
    recordedAmount: status === "approved" ? 100 : null,
    paymentId,
    receiptSignedUrl: null,
    isCurrent: false,
  };
}

function student(cells: ReturnType<typeof cell>[]): SectionCollectionsStudentRow {
  return {
    studentId: "stu-1",
    studentName: "Test",
    documentLabel: null,
    enrolledAt: null,
    row: {
      sectionId: "sec-1",
      sectionName: "A",
      cohortName: "C",
      hasActivePlan: true,
      enrollmentFeeAmount: 0,
      enrollmentFeeExempt: false,
      enrollmentFeeExemptReason: null,
      enrollmentFeeCurrency: "USD",
      cells,
      currentPlan: null,
      enrollmentId: "enr-1",
      enrollmentFeeReceiptStatus: null,
      enrollmentFeeReceiptSignedUrl: null,
      lastEnrollmentPaidAt: null,
    },
    paid: 0,
    pendingReview: 0,
    overdue: 0,
    upcoming: 0,
    expectedYear: 1200,
    hasOverdue: false,
    enrollmentFee: { amount: 0, expectedAmount: 0, exempt: false, exemptReason: null },
    scholarships: [],
    activeScholarshipDiscountPercent: null,
    activePromotionLabel: null,
  };
}

describe("sectionCollectionsCellActionability", () => {
  it("marks due cells as record-selectable only", () => {
    const c = cell(3, "due");
    expect(isSectionCollectionsMonthlyCellRecordSelectable(c)).toBe(true);
    expect(isSectionCollectionsMonthlyCellRevertSelectable(c)).toBe(false);
  });

  it("marks approved cells with paymentId as revert-selectable", () => {
    const c = cell(4, "approved", "pay-1");
    expect(isSectionCollectionsMonthlyCellRecordSelectable(c)).toBe(false);
    expect(isSectionCollectionsMonthlyCellRevertSelectable(c)).toBe(true);
  });

  it("resolves action mode from student row", () => {
    const st = student([cell(2, "due"), cell(5, "approved", "pay-5")]);
    expect(
      sectionCollectionsCellActionMode(st, 2026, 2, false, "2026-01-01", 6),
    ).toBe("record");
    expect(
      sectionCollectionsCellActionMode(st, 2026, 5, false, "2026-01-01", 6),
    ).toBe("revert");
    expect(
      sectionCollectionsCellActionMode(st, 2026, 6, false, "2026-01-01", 6),
    ).toBeNull();
  });
});
