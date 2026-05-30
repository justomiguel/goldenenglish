import type { SupabaseClient } from "@supabase/supabase-js";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

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
  if (!externalReference) return { ok: true, skipped: "missing_external_reference" };

  const paymentIdFromExternalRef = externalReference.startsWith("event_payment:")
    ? externalReference.replace("event_payment:", "").trim()
    : "";

  const { data: row, error: selectError } = await input.admin
    .from("event_payments")
    .select("id")
    .eq(
      paymentIdFromExternalRef ? "id" : "mp_preference_id",
      paymentIdFromExternalRef || externalReference,
    )
    .maybeSingle();
  if (selectError || !row?.id) {
    if (selectError) {
      logSupabaseClientError("finalizeEventPaymentFromMercadoPago:select", selectError, {
        externalReference,
      });
    }
    return { ok: true, skipped: "event_payment_not_found" };
  }

  const paymentId = String(row.id);
  const { error } = await input.admin
    .from("event_payments")
    .update({
      status: "approved",
      gateway_provider: "mercadopago",
      paid_at: payment.date_approved ?? new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("status", "pending");

  if (error) {
    logSupabaseClientError("finalizeEventPaymentFromMercadoPago:update", error, { paymentId });
    return { ok: false };
  }

  await input.admin.from("event_payment_mp_finalize_records").upsert({
    event_payment_id: paymentId,
    mp_payment_id: Number(payment.id),
    mp_preference_id: externalReference,
    currency: payment.currency_id,
    amount: Number(payment.transaction_amount ?? 0),
    paid_at: payment.date_approved ?? new Date().toISOString(),
    payer_email: payment.payer?.email ?? null,
    payment_method: payment.payment_method_id ?? null,
    raw_payload: payment,
  });

  return { ok: true, paymentId };
}
