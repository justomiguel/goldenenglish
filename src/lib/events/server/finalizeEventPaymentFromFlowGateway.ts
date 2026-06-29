import type { SupabaseClient } from "@supabase/supabase-js";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { parseEventGatewayReference } from "@/lib/events/parseEventGatewayReference";
import { markEventPaymentApprovedCore } from "@/lib/events/server/markEventPaymentApprovedCore";
import { upsertApprovedEventGatewayPaymentCore } from "@/lib/events/server/upsertApprovedEventGatewayPaymentCore";

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

  const reference = parseEventGatewayReference(status.data.commerceOrder);
  if (!reference) return { ok: true, skipped: "missing_payment_id" };

  const paidAt = status.data.paymentData?.date ?? new Date().toISOString();

  let paymentId: string;
  if (reference.kind === "attendee") {
    const result = await upsertApprovedEventGatewayPaymentCore({
      admin: input.admin,
      attendeeId: reference.attendeeId,
      gatewayProvider: "flow",
      paidAt,
    });
    if (!result.ok) return { ok: false };
    if ("skipped" in result) return { ok: true, skipped: "event_attendee_not_found" };
    paymentId = result.paymentId;
  } else {
    const approved = await markEventPaymentApprovedCore({
      admin: input.admin,
      paymentId: reference.paymentId,
      gatewayProvider: "flow",
      paidAt,
    });
    if (!approved.ok) {
      if (approved.code === "not_found") {
        return { ok: true, skipped: "event_payment_not_found" };
      }
      logSupabaseClientError(
        "finalizeEventPaymentFromFlowGateway:approve",
        {},
        { paymentId: reference.paymentId },
      );
      return { ok: false };
    }
    paymentId = reference.paymentId;
  }

  await input.admin.from("event_payment_flow_finalize_records").upsert({
    event_payment_id: paymentId,
    flow_order: status.data.flowOrder,
    commerce_order: status.data.commerceOrder,
    currency: status.data.currency,
    amount: status.data.amount,
    paid_at: paidAt,
    payer_email: status.data.payer,
    media_label: status.data.paymentData?.media ?? null,
    raw_payload: status.data,
  });

  return { ok: true, paymentId };
}
