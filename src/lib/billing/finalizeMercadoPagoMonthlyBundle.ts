import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MercadoPagoPaymentPayload } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { loadMonthlyCheckoutBundle } from "@/lib/billing/loadMonthlyCheckoutBundle";
import { finalizeMonthlyPaymentBundle } from "@/lib/billing/finalizeMonthlyPaymentBundle";
import type { FinalizeMonthlyBundleResult } from "@/lib/billing/finalizeMonthlyPaymentBundle";

export async function finalizeMercadoPagoMonthlyBundle(input: {
  admin: SupabaseClient;
  bundleId: string;
  snapshot: MercadoPagoPaymentPayload;
}): Promise<FinalizeMonthlyBundleResult> {
  const bundle = await loadMonthlyCheckoutBundle(input.admin, input.bundleId);
  if (!bundle) return { ok: true, skipped: "bundle_not_found" };
  return finalizeMonthlyPaymentBundle({
    admin: input.admin,
    bundle: {
      studentId: bundle.studentId,
      parentId: bundle.parentId,
      year: bundle.year,
      month: bundle.month,
      sectionIds: bundle.sectionIds,
    },
    gatewayAmount: input.snapshot.transaction_amount,
    gatewayCurrency: input.snapshot.currency_id,
    gatewayProvider: "mercadopago",
    source: "mercadopago",
    gatewayPaymentRef: input.snapshot.id,
  });
}
