import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { loadEnabledGatewaysForBillingCurrency } from "@/lib/payment-gateways/loadEnabledGatewaysForBillingCurrency";
import {
  resolveEventRegistrationPaymentMethods,
  type EventRegistrationPaymentMethod,
} from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";

function parseSiteSettingsBoolean(raw: unknown): boolean | null {
  if (raw === true || raw === "true") return true;
  if (raw === false || raw === "false") return false;
  return null;
}

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
    .eq("key", "events_bank_transfer_enabled")
    .maybeSingle();

  const explicitTransfer = parseSiteSettingsBoolean(data?.value);
  const bankTransferEnabled =
    explicitTransfer ?? enabledGateways.length === 0;

  return resolveEventRegistrationPaymentMethods({ enabledGateways, bankTransferEnabled });
}
