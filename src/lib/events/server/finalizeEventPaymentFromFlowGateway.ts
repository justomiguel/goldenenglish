import type { SupabaseClient } from "@supabase/supabase-js";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { parseEventPaymentIdFromCommerceOrder } from "@/lib/events/parseEventPaymentCommerceOrder";

const FLOW_PAID_STATUS = 2;

export async function finalizeEventPaymentFromFlowGateway(input: {
  admin: SupabaseClient;
  apiBaseUrl: string;
  apiKey: string;
  secretKey: string;
  token: string;
}): Promise<{ ok: boolean; skipped?: string; paymentId?: string }> {
  const status = await flowFetchPaymentStatus({
    apiBaseUrl: input.apiBaseUrl,
    apiKey: input.apiKey,
    secretKey: input.secretKey,
    token: input.token,
  });
  if (!status.ok) return { ok: false };
  if (status.data.status !== FLOW_PAID_STATUS) return { ok: true, skipped: "flow_not_paid" };

  const paymentId = parseEventPaymentIdFromCommerceOrder(status.data.commerceOrder);
  if (!paymentId) return { ok: true, skipped: "missing_payment_id" };

  const { error } = await input.admin
    .from("event_payments")
    .update({ status: "approved", gateway_provider: "flow", paid_at: new Date().toISOString() })
    .eq("id", paymentId)
    .eq("status", "pending");
  if (error) {
    logSupabaseClientError("finalizeEventPaymentFromFlowGateway:update", error, { paymentId });
    return { ok: false };
  }

  await input.admin.from("event_payment_flow_finalize_records").upsert({
    event_payment_id: paymentId,
    flow_order: status.data.flowOrder,
    commerce_order: status.data.commerceOrder,
    currency: status.data.currency,
    amount: status.data.amount,
    paid_at: status.data.paymentData?.date ?? new Date().toISOString(),
    payer_email: status.data.payer,
    media_label: status.data.paymentData?.media ?? null,
    raw_payload: status.data,
  });

  return { ok: true, paymentId };
}
