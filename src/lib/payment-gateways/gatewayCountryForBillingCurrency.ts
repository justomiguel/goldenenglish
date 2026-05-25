import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";

const CURRENCY_TO_COUNTRY: Record<string, PaymentGatewayCountryCode> = {
  CLP: "CL",
  ARS: "AR",
};

/**
 * Maps institute billing currency to the ISO country used in payment_gateway_credentials.
 */
export function gatewayCountryForBillingCurrency(currency: string): PaymentGatewayCountryCode | null {
  const upper = currency.trim().toUpperCase();
  return CURRENCY_TO_COUNTRY[upper] ?? null;
}

/**
 * Whether a gateway supports checkout for the given billing currency.
 */
export function gatewaySupportsBillingCurrency(
  provider: "flow" | "mercadopago",
  currency: string,
): boolean {
  const cur = currency.trim().toUpperCase();
  if (provider === "flow") return cur === "CLP";
  if (provider === "mercadopago") return cur === "CLP" || cur === "ARS";
  return false;
}
