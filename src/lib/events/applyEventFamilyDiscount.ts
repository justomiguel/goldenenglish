const ZERO_DECIMAL_CURRENCIES = new Set(["CLP", "ARS"]);

/** 10% off the registration total. The client never supplies this amount. */
export function applyEventFamilyDiscount(input: {
  amount: number;
  claimed: boolean;
  currency: string;
}): number {
  if (!input.claimed || !(input.amount > 0)) return input.amount;
  const discounted = input.amount * 0.9;
  const digits = ZERO_DECIMAL_CURRENCIES.has(input.currency.trim().toUpperCase()) ? 0 : 2;
  const factor = 10 ** digits;
  return Math.round(discounted * factor) / factor;
}
