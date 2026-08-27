/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { listPayableParentMonthSections } from "@/lib/billing/listPayableParentMonthSections";
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
    fullMonthExpectedAmount: 120,
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
  cellOverrides: Partial<StudentMonthlyPaymentCell> = {},
  rowOverrides: Partial<StudentMonthlyPaymentSectionRow> = {},
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
    cells: [cell(cellOverrides)],
    currentPlan: null,
    enrollmentId: null,
    enrollmentFeeReceiptStatus: null,
    enrollmentFeeReceiptSignedUrl: null,
    lastEnrollmentPaidAt: null,
    allowAdvanceMonthlyPayment: false,
    ...rowOverrides,
  };
}

function view(rows: StudentMonthlyPaymentSectionRow[]): StudentMonthlyPaymentsView {
  return { todayMonth: 5, todayYear: 2026, rows };
}

const BASE = {
  month: 5,
  year: 2026,
  useFullMonthAmount: true,
} as const;

describe("listPayableParentMonthSections", () => {
  it("returns only the origin section when scope is current", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      originSectionId: "sec-a",
      scope: "current",
      view: view([row("sec-a", "Piano"), row("sec-b", "Violin")]),
    });
    expect(result.lines.map((l) => l.sectionId)).toEqual(["sec-a"]);
    expect(result.total).toBe(120);
    expect(result.currency).toBe("CLP");
  });

  it("returns every payable section of the month when scope is all", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      originSectionId: "sec-a",
      scope: "all",
      view: view([row("sec-a", "Piano"), row("sec-b", "Violin", { expectedAmount: 80, fullMonthExpectedAmount: 90 })]),
    });
    expect(result.lines.map((l) => l.sectionId)).toEqual(["sec-a", "sec-b"]);
    expect(result.total).toBe(210);
  });

  it("drops exempt, zero-amount, pending-with-receipt, approved, no-plan, and out-of-period cells", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      originSectionId: "sec-due",
      scope: "all",
      view: view([
        row("sec-due", "Due"),
        row("sec-ex", "Exempt", { status: "exempt", expectedAmount: 0, fullMonthExpectedAmount: 0 }),
        row("sec-zero", "Zero", { status: "due", expectedAmount: 0, fullMonthExpectedAmount: 0 }),
        row("sec-pend", "Pending", {
          status: "pending",
          receiptSignedUrl: "https://example.com/r.pdf",
        }),
        row("sec-ok", "Approved", { status: "approved" }),
        row("sec-np", "No plan", { status: "no-plan", expectedAmount: null, fullMonthExpectedAmount: null, currency: null }),
        row("sec-oop", "OOP", { status: "out-of-period" }),
      ]),
    });
    expect(result.lines.map((l) => l.sectionId)).toEqual(["sec-due"]);
  });

  it("keeps a rejected cell as payable", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      originSectionId: "sec-r",
      scope: "current",
      view: view([row("sec-r", "Rejected", { status: "rejected" })]),
    });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.sectionId).toBe("sec-r");
  });

  it("drops a future month when the section does not allow advance payment", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      month: 8,
      originSectionId: "sec-a",
      scope: "current",
      view: view([
        row("sec-a", "Future", { month: 8, year: 2026, isCurrent: false }, { allowAdvanceMonthlyPayment: false }),
      ]),
    });
    expect(result.lines).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("keeps a future month when advance payment is allowed", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      month: 8,
      originSectionId: "sec-a",
      scope: "current",
      view: view([
        row("sec-a", "Future", { month: 8, year: 2026, isCurrent: false }, { allowAdvanceMonthlyPayment: true }),
      ]),
    });
    expect(result.lines).toHaveLength(1);
  });

  it("excludes other-currency sections from the all set", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      originSectionId: "sec-a",
      scope: "all",
      view: view([
        row("sec-a", "CLP"),
        row("sec-b", "USD", { currency: "USD" }),
      ]),
    });
    expect(result.lines.map((l) => l.sectionId)).toEqual(["sec-a"]);
  });

  it("returns empty when current origin is not payable", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      originSectionId: "sec-ex",
      scope: "current",
      view: view([
        row("sec-ex", "Exempt", { status: "exempt", expectedAmount: 0, fullMonthExpectedAmount: 0 }),
        row("sec-b", "Due"),
      ]),
    });
    expect(result.lines).toEqual([]);
  });

  it("uses expectedAmount when useFullMonthAmount is false", () => {
    const result = listPayableParentMonthSections({
      ...BASE,
      useFullMonthAmount: false,
      originSectionId: "sec-a",
      scope: "current",
      view: view([row("sec-a", "Piano")]),
    });
    expect(result.total).toBe(100);
  });
});
