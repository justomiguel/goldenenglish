import type { SupabaseClient } from "@supabase/supabase-js";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { parseEventPaymentIdFromCommerceOrder } from "@/lib/events/parseEventPaymentCommerceOrder";
import { markEventPaymentApprovedCore } from "@/lib/events/server/markEventPaymentApprovedCore";

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

  const approved = await markEventPaymentApprovedCore({
    admin: input.admin,
    paymentId,
    gatewayProvider: "flow",
    paidAt: status.data.paymentData?.date ?? new Date().toISOString(),
  });

  if (!approved.ok) {
    if (approved.code === "not_found") {
      return { ok: true, skipped: "event_payment_not_found" };
    }
    logSupabaseClientError("finalizeEventPaymentFromFlowGateway:approve", {}, { paymentId });
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
