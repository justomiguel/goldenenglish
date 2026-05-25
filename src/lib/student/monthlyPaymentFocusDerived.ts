import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import { gatewaySupportsBillingCurrency } from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";

export type MonthlyPaymentFocusDerived = {
  expected: number | null;
  originalExpected: number | null;
  hasDiscountedExpected: boolean;
  recordedDisplayAmount: number | null | undefined;
  canUpload: boolean;
  isLocked: boolean;
  enabledOnlineGateways: PaymentGatewayProvider[];
  showOnlinePay: boolean;
};

export function deriveMonthlyPaymentFocusState(input: {
  cell: StudentMonthlyPaymentCell;
  section: StudentMonthlyPaymentSectionRow;
  receiptExpectedUsesFullMonth: boolean;
  enabledOnlineGateways: PaymentGatewayProvider[];
  hasStartFlowAction: boolean;
  hasStartMercadoPagoAction: boolean;
}): MonthlyPaymentFocusDerived {
  const { cell, section, receiptExpectedUsesFullMonth } = input;
  const proratedOrPlan = cell.expectedAmount ?? section.currentPlan?.monthlyFee ?? null;
  const expected = receiptExpectedUsesFullMonth
    ? (cell.fullMonthExpectedAmount ?? proratedOrPlan)
    : proratedOrPlan;
  const originalExpected = receiptExpectedUsesFullMonth
    ? (cell.fullMonthOriginalExpectedAmount ?? cell.originalExpectedAmount)
    : cell.originalExpectedAmount;
  const hasDiscountedExpected =
    expected != null &&
    originalExpected != null &&
    originalExpected > expected &&
    cell.scholarshipDiscountPercent != null;
  const recordedDisplayAmount = receiptExpectedUsesFullMonth
    ? (cell.fullMonthExpectedAmount ?? cell.recordedAmount)
    : cell.recordedAmount;
  const canUpload =
    cell.status === "due" || cell.status === "rejected" || cell.status === "pending";
  const isLocked = cell.status === "out-of-period" || cell.status === "no-plan";
  const currency = (cell.currency ?? "").trim().toUpperCase();

  const gateways = input.enabledOnlineGateways.filter((provider) => {
    if (!gatewaySupportsBillingCurrency(provider, currency)) return false;
    if (provider === "flow") return input.hasStartFlowAction;
    if (provider === "mercadopago") return input.hasStartMercadoPagoAction;
    return false;
  });

  const showOnlinePay = Boolean(canUpload && expected != null && gateways.length > 0);

  return {
    expected: expected ?? null,
    originalExpected: originalExpected ?? null,
    hasDiscountedExpected,
    recordedDisplayAmount,
    canUpload,
    isLocked,
    enabledOnlineGateways: gateways,
    showOnlinePay,
  };
}
