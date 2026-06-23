import {
  gatewaySupportsBillingCurrency,
} from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";

function parsePrice(raw: string): number {
  const value = Number.parseFloat(raw.trim());
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * True when an event has a paid price in a currency no online gateway supports,
 * so only bank transfer could collect it. Surfaced as a non-blocking admin warning.
 */
export function shouldWarnEventCurrencyGateway(input: {
  currency: string;
  priceLocal: string;
  priceNonLocal: string;
}): boolean {
  const hasPaidPrice = parsePrice(input.priceLocal) > 0 || parsePrice(input.priceNonLocal) > 0;
  if (!hasPaidPrice) return false;

  const currency = input.currency.trim().toUpperCase();
  if (!currency) return false;

  const supportedByAnyGateway =
    gatewaySupportsBillingCurrency("mercadopago", currency) ||
    gatewaySupportsBillingCurrency("flow", currency);

  return !supportedByAnyGateway;
}
