import { describe, expect, it } from "vitest";
import { buildFamilyPaymentsSummary } from "@/lib/billing/buildFamilyPaymentsSummary";
import type { BillingInvoiceRow } from "@/types/billing";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";

function baseView(overrides: Partial<StudentMonthlyPaymentsView> = {}): StudentMonthlyPaymentsView {
  return {
    todayMonth: 5,
    todayYear: 2026,
    rows: [],
    ...overrides,
  };
}

function cell(
  month: number,
  status: "due" | "approved" | "pending",
  expectedAmount: number | null = 100,
) {
  return {
    month,
    year: 2026,
    status,
    expectedAmount,
    currency: "CLP",
    proration: null,
    recordedAmount: status === "pending" ? expectedAmount : null,
    paymentId: status === "pending" ? "pay-1" : null,
    receiptSignedUrl: null,
    isCurrent: month === 5,
    fullMonthExpectedAmount: expectedAmount,
  };
}

describe("buildFamilyPaymentsSummary", () => {
  it("sums multiple children with financial access only", () => {
    const summary = buildFamilyPaymentsSummary([
      {
        studentId: "a",
        displayName: "Ana",
        financialAccessActive: true,
        monthlyView: baseView({
          rows: [
            {
              sectionId: "s1",
              sectionName: "A1",
              cohortName: "C",
              hasActivePlan: true,
              enrollmentFeeAmount: 0,
              enrollmentFeeExempt: false,
              enrollmentFeeExemptReason: null,
              enrollmentFeeCurrency: null,
              cells: [cell(3, "due", 50)],
              currentPlan: null,
              enrollmentId: null,
              enrollmentFeeReceiptStatus: null,
              enrollmentFeeReceiptSignedUrl: null,
              lastEnrollmentPaidAt: null,
              allowAdvanceMonthlyPayment: false,
            },
          ],
        }),
        invoices: [],
      },
      {
        studentId: "b",
        displayName: "Ben",
        financialAccessActive: false,
        monthlyView: baseView({
          rows: [
            {
              sectionId: "s2",
              sectionName: "B1",
              cohortName: "C",
              hasActivePlan: true,
              enrollmentFeeAmount: 0,
              enrollmentFeeExempt: false,
              enrollmentFeeExemptReason: null,
              enrollmentFeeCurrency: null,
              cells: [cell(4, "due", 200)],
              currentPlan: null,
              enrollmentId: null,
              enrollmentFeeReceiptStatus: null,
              enrollmentFeeReceiptSignedUrl: null,
              lastEnrollmentPaidAt: null,
              allowAdvanceMonthlyPayment: false,
            },
          ],
        }),
        invoices: [],
      },
    ]);

    expect(summary.familyTotalPending).toBe(50);
    expect(summary.isFamilySettled).toBe(false);
    expect(summary.children[0]?.subtotal).toBe(50);
    expect(summary.children[1]?.subtotal).toBe(0);
  });

  it("does not double-count enrollment when an open enrollment invoice exists", () => {
    const invoices: BillingInvoiceRow[] = [
      {
        id: "inv-1",
        student_id: "a",
        amount: 80,
        due_date: "2026-01-15",
        status: "pending",
        description: "Matrícula 2026",
        external_reference_id: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ];

    const summary = buildFamilyPaymentsSummary([
      {
        studentId: "a",
        displayName: "Ana",
        financialAccessActive: true,
        monthlyView: baseView({
          rows: [
            {
              sectionId: "s1",
              sectionName: "A1",
              cohortName: "C",
              hasActivePlan: true,
              enrollmentFeeAmount: 80,
              enrollmentFeeExempt: false,
              enrollmentFeeExemptReason: null,
              enrollmentFeeCurrency: "CLP",
              cells: [],
              currentPlan: null,
              enrollmentId: "enr-1",
              enrollmentFeeReceiptStatus: null,
              enrollmentFeeReceiptSignedUrl: null,
              lastEnrollmentPaidAt: null,
              allowAdvanceMonthlyPayment: false,
            },
          ],
        }),
        invoices,
      },
    ]);

    const child = summary.children[0]!;
    const enrollmentLines = child.lines.filter((l) => l.kind === "enrollment");
    const invoiceLines = child.lines.filter((l) => l.kind === "invoice");
    expect(enrollmentLines).toHaveLength(0);
    expect(invoiceLines).toHaveLength(1);
    expect(child.subtotal).toBe(80);
  });
});
