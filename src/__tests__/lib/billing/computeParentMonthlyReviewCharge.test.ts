/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { computeParentMonthlyReviewCharge } from "@/lib/billing/computeParentMonthlyReviewCharge";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
  StudentMonthlyPaymentsView,
} from "@/types/studentMonthlyPayments";

function cell(overrides: Partial<StudentMonthlyPaymentCell> = {}): StudentMonthlyPaymentCell {
  return {
    month: 5,
    year: 2026,
    status: "due",
    expectedAmount: 100,
    fullMonthExpectedAmount: 40000,
    currency: "CLP",
    proration: null,
    recordedAmount: null,
    paymentId: null,
    receiptSignedUrl: null,
    isCurrent: true,
    ...overrides,
  };
}

function row(
  sectionId: string,
  sectionName: string,
  amount: number,
): StudentMonthlyPaymentSectionRow {
  return {
    sectionId,
    sectionName,
    cohortName: "C1",
    hasActivePlan: true,
    enrollmentFeeAmount: 0,
    enrollmentFeeExempt: false,
    enrollmentFeeExemptReason: null,
    enrollmentFeeCurrency: "CLP",
    cells: [cell({ fullMonthExpectedAmount: amount, expectedAmount: amount })],
    currentPlan: null,
    enrollmentId: null,
    enrollmentFeeReceiptStatus: null,
    enrollmentFeeReceiptSignedUrl: null,
    lastEnrollmentPaidAt: null,
    allowAdvanceMonthlyPayment: true,
  };
}

function view(rows: StudentMonthlyPaymentSectionRow[]): StudentMonthlyPaymentsView {
  return { rows, todayYear: 2026, todayMonth: 5 };
}

const policyOn = {
  creditPaidTrialOnEnroll: true,
  allowParentPartialSectionPayments: true,
};

describe("computeParentMonthlyReviewCharge", () => {
  it("forces all sections when partial payments are disabled", () => {
    const result = computeParentMonthlyReviewCharge({
      view: view([row("a", "Piano", 40000), row("b", "Violin", 30000)]),
      originSectionId: "a",
      month: 5,
      year: 2026,
      requestedScope: "current",
      submittedTotal: 70000,
      policy: { ...policyOn, allowParentPartialSectionPayments: false },
      trialCredit: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.scope).toBe("all");
    expect(result.total).toBe(70000);
    expect(result.lines).toHaveLength(2);
  });

  it("applies leftover trial credit and accepts the reduced total", () => {
    const result = computeParentMonthlyReviewCharge({
      view: view([row("a", "Piano", 40000)]),
      originSectionId: "a",
      month: 5,
      year: 2026,
      requestedScope: "current",
      submittedTotal: 25000,
      policy: policyOn,
      trialCredit: { registrationId: "reg-1", trialPaid: 15000, alreadyCredited: 0 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.total).toBe(25000);
    expect(result.trialCreditApplied).toBe(15000);
    expect(result.trialCreditRegistrationId).toBe("reg-1");
  });

  it("rejects a submitted total that ignores the forced all-scope", () => {
    const result = computeParentMonthlyReviewCharge({
      view: view([row("a", "Piano", 40000), row("b", "Violin", 30000)]),
      originSectionId: "a",
      month: 5,
      year: 2026,
      requestedScope: "current",
      submittedTotal: 40000,
      policy: { ...policyOn, allowParentPartialSectionPayments: false },
      trialCredit: null,
    });
    expect(result).toEqual({ ok: false, reason: "stale" });
  });
});
