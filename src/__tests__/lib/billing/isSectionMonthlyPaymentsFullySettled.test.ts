import { describe, expect, it } from "vitest";
import { isSectionMonthlyPaymentsFullySettled } from "@/lib/billing/isSectionMonthlyPaymentsFullySettled";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

function cell(
  month: number,
  status: StudentMonthlyPaymentCell["status"],
  expected: number | null = 100,
): StudentMonthlyPaymentCell {
  return {
    month,
    year: 2026,
    status,
    expectedAmount: expected,
    currency: "CLP",
    proration: null,
    recordedAmount: status === "approved" ? expected : null,
    paymentId: null,
    receiptSignedUrl: null,
    isCurrent: false,
    fullMonthExpectedAmount: expected,
  };
}

function row(
  cells: StudentMonthlyPaymentCell[],
  enrollment: Partial<StudentMonthlyPaymentSectionRow> = {},
): StudentMonthlyPaymentSectionRow {
  return {
    sectionId: "s1",
    sectionName: "A1",
    cohortName: "C",
    hasActivePlan: true,
    enrollmentFeeAmount: 0,
    enrollmentFeeExempt: false,
    enrollmentFeeExemptReason: null,
    enrollmentFeeCurrency: null,
    cells,
    currentPlan: null,
    enrollmentId: null,
    enrollmentFeeReceiptStatus: null,
    enrollmentFeeReceiptSignedUrl: null,
    lastEnrollmentPaidAt: null,
    allowAdvanceMonthlyPayment: false,
    ...enrollment,
  };
}

describe("isSectionMonthlyPaymentsFullySettled", () => {
  it("is true when all payable months are approved/exempt and no enrollment due", () => {
    expect(
      isSectionMonthlyPaymentsFullySettled(
        row([
          cell(1, "approved"),
          cell(2, "exempt", 0),
          cell(3, "no-plan", null),
          cell(4, "out-of-period", null),
        ]),
      ),
    ).toBe(true);
  });

  it("is false when a payable month is still due", () => {
    expect(
      isSectionMonthlyPaymentsFullySettled(row([cell(1, "approved"), cell(2, "due")])),
    ).toBe(false);
  });

  it("is false when enrollment fee is unpaid", () => {
    expect(
      isSectionMonthlyPaymentsFullySettled(
        row([cell(1, "approved")], {
          enrollmentFeeAmount: 50,
          enrollmentId: "e1",
        }),
      ),
    ).toBe(false);
  });

  it("is true when enrollment is approved and months are settled", () => {
    expect(
      isSectionMonthlyPaymentsFullySettled(
        row([cell(1, "approved")], {
          enrollmentFeeAmount: 50,
          enrollmentId: "e1",
          enrollmentFeeReceiptStatus: "approved",
        }),
      ),
    ).toBe(true);
  });
});
