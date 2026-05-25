import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnabledPaymentGateway, PaymentGatewayProvider } from "@/types/paymentGateway";
import {
  gatewayCountryForBillingCurrency,
  gatewaySupportsBillingCurrency,
} from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";

function parseProvider(raw: string): PaymentGatewayProvider | null {
  if (raw === "flow" || raw === "mercadopago") return raw;
  return null;
}

/**
 * Returns enabled online gateways for the tenant billing currency (CLP → CL, ARS → AR).
 */
export async function loadEnabledGatewaysForBillingCurrency(
  supabase: SupabaseClient,
  billingCurrency: string,
): Promise<EnabledPaymentGateway[]> {
  const country = gatewayCountryForBillingCurrency(billingCurrency);
  if (!country) return [];

  const { data, error } = await supabase.rpc("enabled_payment_gateways_for_country", {
    p_country_code: country,
  });

  if (error || !Array.isArray(data)) return [];

  const out: EnabledPaymentGateway[] = [];
  for (const raw of data) {
    const provider = parseProvider(String(raw));
    if (!provider) continue;
    if (!gatewaySupportsBillingCurrency(provider, billingCurrency)) continue;
    out.push({ provider });
  }
  return out;
}
