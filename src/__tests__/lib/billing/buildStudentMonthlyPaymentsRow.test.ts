import { describe, it, expect } from "vitest";
import {
  buildStudentMonthlyPaymentsRow,
  type StudentMonthlyPaymentRecord,
} from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import type { SectionFeePlan } from "@/types/sectionFeePlan";

const plan: SectionFeePlan = {
  id: "plan1",
  sectionId: "sec1",
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  paymentsCount: 10,
  chargesEnrollmentFee: true,
  periodStartYear: 2026,
  periodStartMonth: 3,
  archivedAt: null,
};

function recordFor(
  month: number,
  status: StudentMonthlyPaymentRecord["status"],
  withReceipt = true,
): StudentMonthlyPaymentRecord {
  return {
    id: `pay-${month}`,
    sectionId: "sec1",
    month,
    year: 2026,
    amount: 100,
    status,
    receiptSignedUrl: withReceipt ? `https://example.com/receipt-${month}.pdf` : null,
  };
}

describe("buildStudentMonthlyPaymentsRow", () => {
  it("marks months before period as out-of-period and after as out-of-period", () => {
    const row = buildStudentMonthlyPaymentsRow({
      sectionId: "sec1",
      sectionName: "S1",
      cohortName: "C1",
      plans: [plan],
      payments: [],
      scholarship: null,
      todayYear: 2026,
      todayMonth: 5,
    });
    expect(row.cells[0].status).toBe("out-of-period");
    expect(row.cells[1].status).toBe("out-of-period");
    expect(row.cells[2].status).toBe("due");
    expect(row.cells[11].status).toBe("due");
    expect(row.hasActivePlan).toBe(true);
    expect(row.chargesEnrollmentFee).toBe(true);
  });

  it("returns no-plan for every month when there are no plans", () => {
    const row = buildStudentMonthlyPaymentsRow({
      sectionId: "sec1",
      sectionName: "S1",
      cohortName: "C1",
      plans: [],
      payments: [],
      scholarship: null,
      todayYear: 2026,
      todayMonth: 5,
    });
    expect(row.cells.every((c) => c.status === "no-plan")).toBe(true);
    expect(row.hasActivePlan).toBe(false);
    expect(row.chargesEnrollmentFee).toBe(false);
  });

  it("derives status from existing payment rows", () => {
    const payments = [
      recordFor(3, "approved"),
      recordFor(4, "rejected"),
      recordFor(5, "exempt"),
      recordFor(6, "pending", true),
      recordFor(7, "pending", false),
    ];
    const row = buildStudentMonthlyPaymentsRow({
      sectionId: "sec1",
      sectionName: "S1",
      cohortName: "C1",
      plans: [plan],
      payments,
      scholarship: null,
      todayYear: 2026,
      todayMonth: 5,
    });
    expect(row.cells[2].status).toBe("approved");
    expect(row.cells[3].status).toBe("rejected");
    expect(row.cells[4].status).toBe("exempt");
    expect(row.cells[5].status).toBe("pending");
    expect(row.cells[6].status).toBe("due");
  });

  it("flags the current month with isCurrent", () => {
    const row = buildStudentMonthlyPaymentsRow({
      sectionId: "sec1",
      sectionName: "S1",
      cohortName: "C1",
      plans: [plan],
      payments: [],
      scholarship: null,
      todayYear: 2026,
      todayMonth: 5,
    });
    expect(row.cells[4].isCurrent).toBe(true);
    expect(row.cells.filter((c) => c.isCurrent)).toHaveLength(1);
  });

  it("applies scholarship discount to expected amount", () => {
    const row = buildStudentMonthlyPaymentsRow({
      sectionId: "sec1",
      sectionName: "S1",
      cohortName: "C1",
      plans: [plan],
      payments: [],
      scholarship: {
        discount_percent: 50,
        valid_from_year: 2026,
        valid_from_month: 1,
        valid_until_year: null,
        valid_until_month: null,
        is_active: true,
      },
      todayYear: 2026,
      todayMonth: 5,
    });
    expect(row.cells[4].expectedAmount).toBe(50);
  });
});
