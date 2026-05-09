import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

export type MonthlyPaymentFocusDerived = {
  expected: number | null;
  originalExpected: number | null;
  hasDiscountedExpected: boolean;
  recordedDisplayAmount: number | null | undefined;
  canUpload: boolean;
  isLocked: boolean;
  isClp: boolean;
  showFlowPay: boolean;
};

export function deriveMonthlyPaymentFocusState(input: {
  cell: StudentMonthlyPaymentCell;
  section: StudentMonthlyPaymentSectionRow;
  receiptExpectedUsesFullMonth: boolean;
  flowMonthlyPayEnabled: boolean;
  hasStartFlowAction: boolean;
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
  const isClp = (cell.currency ?? "").trim().toUpperCase() === "CLP";
  const showFlowPay = Boolean(
    input.flowMonthlyPayEnabled &&
      input.hasStartFlowAction &&
      isClp &&
      canUpload &&
      expected != null,
  );

  return {
    expected: expected ?? null,
    originalExpected: originalExpected ?? null,
    hasDiscountedExpected,
    recordedDisplayAmount,
    canUpload,
    isLocked,
    isClp,
    showFlowPay,
  };
}
