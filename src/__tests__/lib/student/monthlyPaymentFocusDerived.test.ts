import { describe, expect, it } from "vitest";
import { deriveMonthlyPaymentFocusState } from "@/lib/student/monthlyPaymentFocusDerived";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

function baseCell(over: Partial<StudentMonthlyPaymentCell>): StudentMonthlyPaymentCell {
  return {
    month: 5,
    year: 2026,
    status: "due",
    currency: "CLP",
    expectedAmount: 1000,
    originalExpectedAmount: 1000,
    fullMonthExpectedAmount: 1000,
    fullMonthOriginalExpectedAmount: 1000,
    proration: null,
    recordedAmount: null,
    paymentId: null,
    scholarshipDiscountPercent: null,
    receiptSignedUrl: null,
    isCurrent: false,
    ...over,
  };
}

function baseSection(): StudentMonthlyPaymentSectionRow {
  return {
    sectionId: "sec",
    sectionName: "Section A",
    cohortName: "",
    enrollmentId: null,
    enrollmentFeeAmount: 0,
    enrollmentFeeCurrency: null,
    enrollmentFeeExempt: false,
    enrollmentFeeExemptReason: null,
    enrollmentFeeReceiptStatus: null,
    enrollmentFeeReceiptSignedUrl: null,
    lastEnrollmentPaidAt: null,
    hasActivePlan: true,
    allowAdvanceMonthlyPayment: false,
    cells: [],
    currentPlan: {
      id: "p1",
      sectionId: "sec",
      effectiveFromYear: 2026,
      effectiveFromMonth: 1,
      monthlyFee: 1000,
      currency: "CLP",
      archivedAt: null,
    },
  };
}

describe("deriveMonthlyPaymentFocusState", () => {
  it("enables online pay for CLP when Flow gateway and action exist", () => {
    const s = deriveMonthlyPaymentFocusState({
      cell: baseCell({ status: "due", currency: "CLP" }),
      section: baseSection(),
      receiptExpectedUsesFullMonth: false,
      enabledOnlineGateways: ["flow"],
      hasStartFlowAction: true,
      hasStartMercadoPagoAction: false,
    });
    expect(s.showOnlinePay).toBe(true);
    expect(s.enabledOnlineGateways).toEqual(["flow"]);
  });

  it("supports Mercado Pago for ARS when action exists", () => {
    const s = deriveMonthlyPaymentFocusState({
      cell: baseCell({ currency: "ARS", status: "due" }),
      section: baseSection(),
      receiptExpectedUsesFullMonth: false,
      enabledOnlineGateways: ["mercadopago"],
      hasStartFlowAction: false,
      hasStartMercadoPagoAction: true,
    });
    expect(s.showOnlinePay).toBe(true);
    expect(s.enabledOnlineGateways).toEqual(["mercadopago"]);
  });

  it("offers both gateways in Chile when both are enabled", () => {
    const s = deriveMonthlyPaymentFocusState({
      cell: baseCell({ currency: "CLP", status: "due" }),
      section: baseSection(),
      receiptExpectedUsesFullMonth: false,
      enabledOnlineGateways: ["flow", "mercadopago"],
      hasStartFlowAction: true,
      hasStartMercadoPagoAction: true,
    });
    expect(s.enabledOnlineGateways).toEqual(["flow", "mercadopago"]);
    expect(s.showOnlinePay).toBe(true);
  });

  it("disables online pay for unsupported currency", () => {
    const s = deriveMonthlyPaymentFocusState({
      cell: baseCell({ currency: "USD" }),
      section: baseSection(),
      receiptExpectedUsesFullMonth: false,
      enabledOnlineGateways: ["flow", "mercadopago"],
      hasStartFlowAction: true,
      hasStartMercadoPagoAction: true,
    });
    expect(s.showOnlinePay).toBe(false);
    expect(s.enabledOnlineGateways).toEqual([]);
  });

  it("pulls amounts from full-month fields when receiptExpectedUsesFullMonth is true", () => {
    const s = deriveMonthlyPaymentFocusState({
      cell: baseCell({
        fullMonthExpectedAmount: 50_000,
        fullMonthOriginalExpectedAmount: 48_000,
        expectedAmount: 12_500,
      }),
      section: baseSection(),
      receiptExpectedUsesFullMonth: true,
      enabledOnlineGateways: [],
      hasStartFlowAction: false,
      hasStartMercadoPagoAction: false,
    });
    expect(s.expected).toBe(50_000);
    expect(s.originalExpected).toBe(48_000);
  });

  it("marks discounted expected when original value is larger and scholarship applies", () => {
    const s = deriveMonthlyPaymentFocusState({
      cell: baseCell({
        expectedAmount: 900,
        originalExpectedAmount: 1000,
        scholarshipDiscountPercent: 10,
      }),
      section: baseSection(),
      receiptExpectedUsesFullMonth: false,
      enabledOnlineGateways: [],
      hasStartFlowAction: false,
      hasStartMercadoPagoAction: false,
    });
    expect(s.hasDiscountedExpected).toBe(true);
  });

  it("flags locked statuses for out-of-period and no-plan", () => {
    expect(
      deriveMonthlyPaymentFocusState({
        cell: baseCell({ status: "out-of-period" }),
        section: baseSection(),
        receiptExpectedUsesFullMonth: false,
        enabledOnlineGateways: [],
        hasStartFlowAction: false,
        hasStartMercadoPagoAction: false,
      }).isLocked,
    ).toBe(true);
    expect(
      deriveMonthlyPaymentFocusState({
        cell: baseCell({ status: "no-plan" }),
        section: baseSection(),
        receiptExpectedUsesFullMonth: false,
        enabledOnlineGateways: [],
        hasStartFlowAction: false,
        hasStartMercadoPagoAction: false,
      }).isLocked,
    ).toBe(true);
  });

  it("detects Chilean pesos with surrounding whitespace casing", () => {
    expect(
      deriveMonthlyPaymentFocusState({
        cell: baseCell({ currency: " clp ", status: "due" }),
        section: baseSection(),
        receiptExpectedUsesFullMonth: false,
        enabledOnlineGateways: ["flow"],
        hasStartFlowAction: true,
        hasStartMercadoPagoAction: false,
      }).showOnlinePay,
    ).toBe(true);
  });
});
