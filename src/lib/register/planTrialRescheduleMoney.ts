export type TrialRescheduleMoney =
  | { kind: "confirm" }
  | { kind: "pay_delta"; amount: number; currency: string }
  | { kind: "refund_due"; amount: number; currency: string };

export function planTrialRescheduleMoney(input: {
  capturedTotal: number;
  newQuoteTotal: number;
  currency: string;
}): TrialRescheduleMoney {
  const captured = Math.max(0, Number(input.capturedTotal) || 0);
  const next = Math.max(0, Number(input.newQuoteTotal) || 0);
  const delta = next - captured;
  if (delta > 0) {
    return { kind: "pay_delta", amount: delta, currency: input.currency };
  }
  if (delta < 0 && captured > 0) {
    return { kind: "refund_due", amount: -delta, currency: input.currency };
  }
  return { kind: "confirm" };
}
