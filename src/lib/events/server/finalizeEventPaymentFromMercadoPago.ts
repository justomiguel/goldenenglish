import type { SupabaseClient } from "@supabase/supabase-js";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { markEventPaymentApprovedCore } from "@/lib/events/server/markEventPaymentApprovedCore";
import { upsertApprovedEventGatewayPaymentCore } from "@/lib/events/server/upsertApprovedEventGatewayPaymentCore";
import { parseEventGatewayReference } from "@/lib/events/parseEventGatewayReference";

type LegacyResolution =
  | { status: "ok"; paymentId: string }
  | { status: "not_found" }
  | { status: "error" };

async function resolveLegacyPaymentId(
  admin: SupabaseClient,
  paymentId: string,
  paidAt: string,
): Promise<LegacyResolution> {
  const { data: row, error } = await admin
    .from("event_payments")
    .select("id")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("finalizeEventPaymentFromMercadoPago:legacySelect", error, {
      paymentId,
    });
    return { status: "error" };
  }
  if (!row?.id) return { status: "not_found" };

  const approved = await markEventPaymentApprovedCore({
    admin,
    paymentId: String(row.id),
    gatewayProvider: "mercadopago",
    paidAt,
  });
  if (approved.ok) return { status: "ok", paymentId: String(row.id) };
  // A genuine approval failure (e.g. update_failed) must surface so the webhook retries;
  // only a missing row counts as "not found".
  return approved.code === "not_found" ? { status: "not_found" } : { status: "error" };
}

export async function finalizeEventPaymentFromMercadoPago(input: {
  admin: SupabaseClient;
  accessToken: string;
  mpPaymentId: string;
}): Promise<{ ok: boolean; skipped?: string; paymentId?: string }> {
  const response = await mercadoPagoGetPayment({
    accessToken: input.accessToken,
    paymentId: input.mpPaymentId,
  });
  if (!response.ok) return { ok: false };
  const payment = response.data;
  if (payment.status !== "approved") return { ok: true, skipped: "mp_not_approved" };

  const externalReference = payment.external_reference?.trim() ?? "";
  const reference = parseEventGatewayReference(externalReference);
  if (!reference) return { ok: true, skipped: "missing_external_reference" };

  const paidAt = payment.date_approved ?? new Date().toISOString();

  let paymentId: string;
  if (reference.kind === "attendee") {
    const result = await upsertApprovedEventGatewayPaymentCore({
      admin: input.admin,
      attendeeId: reference.attendeeId,
      gatewayProvider: "mercadopago",
      paidAt,
    });
    if (!result.ok) return { ok: false };
    if ("skipped" in result) return { ok: true, skipped: "event_attendee_not_found" };
    paymentId = result.paymentId;
  } else {
    const legacy = await resolveLegacyPaymentId(input.admin, reference.paymentId, paidAt);
    if (legacy.status === "not_found") return { ok: true, skipped: "event_payment_not_found" };
    if (legacy.status === "error") return { ok: false };
    paymentId = legacy.paymentId;
  }

  await input.admin.from("event_payment_mp_finalize_records").upsert({
    event_payment_id: paymentId,
    mp_payment_id: Number(payment.id),
    mp_preference_id: externalReference,
    currency: payment.currency_id,
    amount: Number(payment.transaction_amount ?? 0),
    paid_at: paidAt,
    payer_email: payment.payer?.email ?? null,
    payment_method: payment.payment_method_id ?? null,
    raw_payload: payment,
  });

  return { ok: true, paymentId };
}
