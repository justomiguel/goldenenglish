export const SUGGESTED_BILLING_CURRENCIES = [
  "ARS",
  "BRL",
  "CLP",
  "EUR",
  "MXN",
  "USD",
  "UYU",
] as const;

export const ISO_4217_CURRENCY_RE = /^[A-Z]{3}$/;

export function normalizeBillingCurrencyInput(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidBillingCurrency(raw: string): boolean {
  return ISO_4217_CURRENCY_RE.test(normalizeBillingCurrencyInput(raw));
}
