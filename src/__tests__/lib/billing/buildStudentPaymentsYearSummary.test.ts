// REGRESSION CHECK: Changing the year-summary buckets affects the consolidated
// financial card the student/tutor sees on /dashboard/student/payments. Keep the
// post-scholarship semantics (the loader pre-applies the discount) and the
// "credit-from-overpayment" rule until an explicit `student_credits` source exists.

import { describe, it, expect } from "vitest";
import { buildStudentPaymentsYearSummary } from "@/lib/billing/buildStudentPaymentsYearSummary";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
  StudentMonthlyPaymentsView,
} from "@/types/studentMonthlyPayments";

interface CellSeed {
  month: number;
  status: StudentMonthlyPaymentCell["status"];
  expected?: number | null;
  fullExpected?: number | null;
  recorded?: number | null;
}

function buildSection(
  sectionId: string,
  sectionName: string,
  seeds: CellSeed[],
  todayMonth: number,
  todayYear: number,
): StudentMonthlyPaymentSectionRow {
  const cells: StudentMonthlyPaymentCell[] = seeds.map((s) => ({
    month: s.month,
    year: todayYear,
    status: s.status,
    expectedAmount: s.expected ?? null,
    fullMonthExpectedAmount: s.fullExpected ?? s.expected ?? null,
    currency: null,
    proration: null,
    recordedAmount: s.recorded ?? null,
    paymentId: null,
    receiptSignedUrl: null,
    isCurrent: s.month === todayMonth,
  }));
  return {
    sectionId,
    sectionName,
    cohortName: `${sectionName} cohort`,
    hasActivePlan: true,
    enrollmentFeeAmount: 0,
    enrollmentFeeExempt: false,
    enrollmentFeeExemptReason: null,
    enrollmentFeeCurrency: null,
    cells,
    currentPlan: null,
  };
}

function viewFromRows(
  rows: StudentMonthlyPaymentSectionRow[],
  todayMonth = 5,
  todayYear = 2026,
): StudentMonthlyPaymentsView {
  return { todayMonth, todayYear, rows };
}

describe("buildStudentPaymentsYearSummary", () => {
  it("returns zeroed buckets and no nextDue for an empty view", () => {
    const summary = buildStudentPaymentsYearSummary(viewFromRows([]));
    expect(summary).toMatchObject({
      year: 2026,
      paid: 0,
      pendingReview: 0,
      overdue: 0,
      upcoming: 0,
      creditBalance: 0,
      totalDebt: 0,
      nextDue: null,
    });
  });

  it("classifies past due months as overdue and current/future as upcoming", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [
        { month: 3, status: "due", expected: 100 },
        { month: 4, status: "due", expected: 100 },
        { month: 5, status: "due", expected: 100 },
        { month: 6, status: "due", expected: 100 },
        { month: 7, status: "due", expected: 100 },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.overdue).toBe(200);
    expect(summary.upcoming).toBe(300);
    expect(summary.totalDebt).toBe(500);
  });

  it("treats rejected months as still owed (overdue when past)", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [
        { month: 3, status: "rejected", expected: 100 },
        { month: 6, status: "rejected", expected: 100 },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.overdue).toBe(100);
    expect(summary.upcoming).toBe(100);
  });

  it("sums approved.recordedAmount into Paid and ignores out-of-period/no-plan", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [
        { month: 1, status: "out-of-period" },
        { month: 2, status: "no-plan" },
        { month: 3, status: "approved", expected: 100, recorded: 100 },
        { month: 4, status: "approved", expected: 100, recorded: 100 },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.paid).toBe(200);
    expect(summary.overdue).toBe(0);
    expect(summary.upcoming).toBe(0);
  });

  it("uses the full-month amount for paid cells when the student view hides proration", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [{ month: 4, status: "approved", expected: 6.25, fullExpected: 25, recorded: 6.25 }],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.paid).toBe(25);
  });

  it("counts exempt cells as settled with 0 amount", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [{ month: 3, status: "exempt", expected: 0 }],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.paid).toBe(0);
    expect(summary.overdue).toBe(0);
  });

  it("sums pending receipts into PendingReview using recorded amount when available", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [
        { month: 3, status: "pending", expected: 100, recorded: 100 },
        { month: 4, status: "pending", expected: 100, recorded: null },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.pendingReview).toBe(200);
  });

  it("uses the full-month amount for pending receipts when present", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [{ month: 4, status: "pending", expected: 6.25, fullExpected: 25, recorded: 6.25 }],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.pendingReview).toBe(25);
  });

  it("derives credit balance from over-payments on approved cells and reduces total debt", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [
        { month: 3, status: "approved", expected: 100, recorded: 150 },
        { month: 4, status: "approved", expected: 100, recorded: 100 },
        { month: 6, status: "due", expected: 100 },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.creditBalance).toBe(50);
    expect(summary.upcoming).toBe(100);
    expect(summary.totalDebt).toBe(50);
  });

  it("never returns a negative total debt when credit exceeds outstanding amounts", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [
        { month: 3, status: "approved", expected: 100, recorded: 500 },
        { month: 6, status: "due", expected: 100 },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.creditBalance).toBe(400);
    expect(summary.totalDebt).toBe(0);
  });

  it("respects the post-scholarship expected amount provided by the view", () => {
    const section = buildSection(
      "sec1",
      "B1",
      [
        { month: 3, status: "due", expected: 50 },
        { month: 4, status: "due", expected: 50 },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([section]));
    expect(summary.overdue).toBe(100);
  });

  it("returns the earliest in-period due/rejected cell across sections as nextDue", () => {
    const a = buildSection(
      "sec-a",
      "Alpha",
      [{ month: 7, status: "due", expected: 120 }],
      5,
      2026,
    );
    const b = buildSection(
      "sec-b",
      "Beta",
      [
        { month: 4, status: "due", expected: 90 },
        { month: 6, status: "due", expected: 90 },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([a, b]));
    expect(summary.nextDue).toEqual({
      sectionId: "sec-b",
      sectionName: "Beta",
      year: 2026,
      month: 4,
      amount: 90,
    });
  });

  it("returns null nextDue when nothing is due/rejected", () => {
    const a = buildSection(
      "sec-a",
      "Alpha",
      [
        { month: 3, status: "approved", expected: 100, recorded: 100 },
        { month: 4, status: "exempt", expected: 0 },
      ],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([a]));
    expect(summary.nextDue).toBeNull();
  });

  it("breaks ties on (year, month) deterministically by section name", () => {
    const a = buildSection(
      "sec-a",
      "Bravo",
      [{ month: 6, status: "due", expected: 100 }],
      5,
      2026,
    );
    const b = buildSection(
      "sec-b",
      "Alpha",
      [{ month: 6, status: "due", expected: 100 }],
      5,
      2026,
    );
    const summary = buildStudentPaymentsYearSummary(viewFromRows([a, b]));
    expect(summary.nextDue?.sectionName).toBe("Alpha");
  });
});
