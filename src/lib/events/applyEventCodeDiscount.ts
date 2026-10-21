const ZERO_DECIMAL_CURRENCIES = new Set(["CLP", "ARS"]);

/** Percent off a registration total. The client never supplies this amount. */
export function applyEventCodeDiscount(input: {
  amount: number;
  percent: number;
  currency: string;
}): number {
  if (!(input.amount > 0) || !(input.percent > 0)) return input.amount;
  const discounted = input.amount * (1 - input.percent / 100);
  const digits = ZERO_DECIMAL_CURRENCIES.has(input.currency.trim().toUpperCase()) ? 0 : 2;
  const factor = 10 ** digits;
  return Math.round(discounted * factor) / factor;
}
