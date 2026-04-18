import { describe, it, expect } from "vitest";
import {
  buildStudentMonthlyPaymentsRow,
  type StudentMonthlyPaymentRecord,
  type BuildStudentMonthlyPaymentsRowInput,
} from "@/lib/billing/buildStudentMonthlyPaymentsRow";
import type { SectionFeePlan } from "@/types/sectionFeePlan";
import type { SectionScheduleSlot } from "@/types/academics";

const plan: SectionFeePlan = {
  id: "plan1",
  sectionId: "sec1",
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  currency: "USD",
  archivedAt: null,
};

// Section operates from March through December 2026, both Tuesdays and Thursdays.
const tuesdayThursday: SectionScheduleSlot[] = [
  { dayOfWeek: 2, startTime: "18:00", endTime: "19:30" },
  { dayOfWeek: 4, startTime: "18:00", endTime: "19:30" },
];

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

function baseInput(
  overrides: Partial<BuildStudentMonthlyPaymentsRowInput> = {},
): BuildStudentMonthlyPaymentsRowInput {
  return {
    sectionId: "sec1",
    sectionName: "S1",
    cohortName: "C1",
    plans: [plan],
    payments: [],
    scholarship: null,
    todayYear: 2026,
    todayMonth: 5,
    sectionStartsOn: "2026-03-01",
    sectionEndsOn: "2026-12-31",
    studentEnrolledAt: "2026-03-01",
    scheduleSlots: tuesdayThursday,
    sectionEnrollmentFeeAmount: 150,
    ...overrides,
  };
}

describe("buildStudentMonthlyPaymentsRow", () => {
  it("marks months outside section operative range as out-of-period", () => {
    const row = buildStudentMonthlyPaymentsRow(baseInput());
    expect(row.cells[0].status).toBe("out-of-period");
    expect(row.cells[1].status).toBe("out-of-period");
    expect(row.cells[2].status).toBe("due");
    expect(row.cells[11].status).toBe("due");
    expect(row.hasActivePlan).toBe(true);
    expect(row.enrollmentFeeAmount).toBe(150);
    expect(row.enrollmentFeeCurrency).toBe("USD");
  });

  it("returns no-plan for every month when there are no plans", () => {
    const row = buildStudentMonthlyPaymentsRow(baseInput({ plans: [] }));
    expect(row.cells.every((c) => c.status === "no-plan")).toBe(true);
    expect(row.hasActivePlan).toBe(false);
    // Enrollment amount survives even without a plan, but currency is unknown
    // until a plan exists, so the strip should not display an amount.
    expect(row.enrollmentFeeCurrency).toBeNull();
  });

  it("returns enrollmentFeeAmount=0 and currency=null when section does not charge matricula", () => {
    const row = buildStudentMonthlyPaymentsRow(
      baseInput({ sectionEnrollmentFeeAmount: 0 }),
    );
    expect(row.enrollmentFeeAmount).toBe(0);
    expect(row.enrollmentFeeCurrency).toBeNull();
  });

  it("derives status from existing payment rows", () => {
    const payments = [
      recordFor(3, "approved"),
      recordFor(4, "rejected"),
      recordFor(5, "exempt"),
      recordFor(6, "pending", true),
      recordFor(7, "pending", false),
    ];
    const row = buildStudentMonthlyPaymentsRow(baseInput({ payments }));
    expect(row.cells[2].status).toBe("approved");
    expect(row.cells[3].status).toBe("rejected");
    expect(row.cells[4].status).toBe("exempt");
    expect(row.cells[5].status).toBe("pending");
    expect(row.cells[6].status).toBe("due");
  });

  it("flags the current month with isCurrent", () => {
    const row = buildStudentMonthlyPaymentsRow(baseInput());
    expect(row.cells[4].isCurrent).toBe(true);
    expect(row.cells.filter((c) => c.isCurrent)).toHaveLength(1);
  });

  it("applies scholarship discount to expected amount on full-month cells", () => {
    const row = buildStudentMonthlyPaymentsRow(
      baseInput({
        scholarship: {
          discount_percent: 50,
          valid_from_year: 2026,
          valid_from_month: 1,
          valid_until_year: null,
          valid_until_month: null,
          is_active: true,
        },
      }),
    );
    expect(row.cells[4].expectedAmount).toBe(50);
  });

  it("exposes the plan currency on each cell when there is a plan", () => {
    const row = buildStudentMonthlyPaymentsRow(baseInput());
    expect(row.cells[4].currency).toBe("USD");
  });

  it("prorates expected amount when student enrolls mid-month", () => {
    // Section dictates Tuesdays/Thursdays during May 2026.
    // May 2026 Tuesdays: 5,12,19,26 — Thursdays: 7,14,21,28 → 8 classes total.
    // Student joins on 2026-05-20: only Tuesday 26 + Thursday 21,28 → 3 classes.
    const row = buildStudentMonthlyPaymentsRow(
      baseInput({ studentEnrolledAt: "2026-05-20" }),
    );
    const may = row.cells[4];
    expect(may.status).toBe("due");
    expect(may.proration).toEqual({ numerator: 3, denominator: 8 });
    expect(may.expectedAmount).toBe(37.5);
  });

  it("sets out-of-period when the student joined after the month ended", () => {
    const row = buildStudentMonthlyPaymentsRow(
      baseInput({ studentEnrolledAt: "2026-06-01", todayMonth: 6 }),
    );
    expect(row.cells[4].status).toBe("out-of-period");
    expect(row.cells[4].proration).toBeNull();
  });
});
