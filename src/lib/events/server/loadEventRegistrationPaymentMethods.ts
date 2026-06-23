import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { loadEnabledGatewaysForBillingCurrency } from "@/lib/payment-gateways/loadEnabledGatewaysForBillingCurrency";
import {
  resolveEventRegistrationPaymentMethods,
  type EventRegistrationPaymentMethod,
} from "@/lib/events/resolveEventRegistrationPaymentMethods";
import {
  EVENTS_BANK_TRANSFER_ENABLED_DEFAULT,
  EVENTS_BANK_TRANSFER_ENABLED_KEY,
  parseEventsBankTransferEnabled,
} from "@/lib/events/eventsBankTransferSetting";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";

/** Enabled online gateways + optional bank transfer for public event registration. */
export async function loadEventRegistrationPaymentMethods(
  currency: string,
): Promise<EventRegistrationPaymentMethod[]> {
  const admin = createAdminClient();
  const enabledRows = await loadEnabledGatewaysForBillingCurrency(admin, currency);
  const enabledGateways = enabledRows.map((row) => row.provider) as PaymentGatewayProvider[];

  const { data } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", EVENTS_BANK_TRANSFER_ENABLED_KEY)
    .maybeSingle();

  const bankTransferEnabled =
    parseEventsBankTransferEnabled(data?.value) ?? EVENTS_BANK_TRANSFER_ENABLED_DEFAULT;

  return resolveEventRegistrationPaymentMethods({ enabledGateways, bankTransferEnabled });
}
