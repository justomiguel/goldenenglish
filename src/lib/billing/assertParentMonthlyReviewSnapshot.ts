import { amountsMatchForCurrency } from "@/lib/billing/upsertApprovedMonthlyPaymentSupport";

export function assertParentMonthlyReviewSnapshot(input: {
  computedTotal: number;
  submittedTotal: number;
  currency: string;
}): boolean {
  return amountsMatchForCurrency(
    input.computedTotal,
    input.submittedTotal,
    input.currency.trim().toUpperCase(),
  );
}
