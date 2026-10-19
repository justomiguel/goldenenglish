import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { loadFlowChileCredentialsPlain } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import {
  gatewayCountryForBillingCurrency,
  gatewaySupportsBillingCurrency,
} from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import { payableEventOnlineGateways } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";

/**
 * Online gateways the event form may offer. Uses the same credential read as
 * checkout, so a disabled Mercado Pago row is never shown.
 */
export async function loadPayableEventGateways(
  admin: SupabaseClient,
  currency: string,
): Promise<PaymentGatewayProvider[]> {
  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    return [];
  }

  const country = gatewayCountryForBillingCurrency(currency);
  let flowEnabled = false;
  let mercadoPagoEnabled = false;

  if (gatewaySupportsBillingCurrency("flow", currency)) {
    try {
      const creds = await loadFlowChileCredentialsPlain(admin, rawKey);
      flowEnabled = Boolean(creds?.enabled);
    } catch {
      flowEnabled = false;
    }
  }

  if (country && gatewaySupportsBillingCurrency("mercadopago", currency)) {
    try {
      const creds = await loadMercadoPagoCredentialsPlain(admin, rawKey, country);
      mercadoPagoEnabled = Boolean(creds?.enabled);
    } catch {
      mercadoPagoEnabled = false;
    }
  }

  return payableEventOnlineGateways({ flowEnabled, mercadoPagoEnabled });
}
