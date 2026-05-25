import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MercadoPagoPaymentPayload } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function upsertMpFinalizeRecord(input: {
  admin: SupabaseClient;
  paymentId: string;
  preferenceId: string;
  snapshot: MercadoPagoPaymentPayload;
}): Promise<{ ok: boolean }> {
  const { admin, paymentId, preferenceId, snapshot } = input;
  const paidAtIso = snapshot.date_approved
    ? new Date(snapshot.date_approved).toISOString()
    : new Date().toISOString();
  const payerEmail =
    typeof snapshot.payer?.email === "string" && snapshot.payer.email.trim()
      ? snapshot.payer.email.trim()
      : null;

  const row = {
    payment_id: paymentId,
    mp_payment_id: snapshot.id,
    mp_preference_id: preferenceId,
    currency: snapshot.currency_id,
    amount: snapshot.transaction_amount,
    paid_at: paidAtIso,
    payer_email: payerEmail,
    payment_method: snapshot.payment_method_id,
    raw_payload: snapshot as unknown as Record<string, unknown>,
  };

  const { error } = await admin
    .from("payment_mp_finalize_records")
    .upsert(row, { onConflict: "payment_id", ignoreDuplicates: true });

  if (error) {
    logSupabaseClientError("upsertMpFinalizeRecord", error, {
      payment_id_prefix: paymentId.slice(0, 8),
    });
    return { ok: false };
  }
  return { ok: true };
}
