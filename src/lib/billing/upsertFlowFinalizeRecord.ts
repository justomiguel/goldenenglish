import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlowStatusPayload } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/**
 * Idempotent insert into `payment_flow_finalize_records` after a payment was approved via Flow.
 *
 * - PRIMARY KEY is `payment_id` so concurrent finalize calls (webhook + return resolver) coexist.
 * - We trust `flowPaidSnapshot` already has `status === 2`; the caller asserts that.
 * - `paid_at` prefers Flow `paymentData.date` (authoritative); falls back to `now`.
 * - We log Supabase failures but **do not** roll back the payment status — the payments row
 *   stays approved. The receipt loader has a graceful fallback when this row is missing.
 */
export async function upsertFlowFinalizeRecord(input: {
  admin: SupabaseClient;
  paymentId: string;
  snapshot: FlowStatusPayload;
}): Promise<{ ok: boolean }> {
  const { admin, paymentId, snapshot } = input;

  const paymentData = snapshot.paymentData;
  const paidAtIso = parseFlowDate(paymentData?.date) ?? new Date().toISOString();
  const mediaLabel = paymentData?.media?.trim() || null;
  const payerEmail = typeof snapshot.payer === "string" && snapshot.payer.trim() ? snapshot.payer.trim() : null;
  const transferDateIso = parseFlowDate(paymentData?.transferDate);
  const conversionDateIso = parseFlowDate(paymentData?.conversionDate);

  const row = {
    payment_id: paymentId,
    flow_order: snapshot.flowOrder,
    commerce_order: snapshot.commerceOrder,
    currency: snapshot.currency,
    amount: snapshot.amount,
    paid_at: paidAtIso,
    payer_email: payerEmail,
    media_label: mediaLabel,
    raw_payload: snapshot as unknown as Record<string, unknown>,
    fee: paymentData?.fee ?? null,
    balance: paymentData?.balance ?? null,
    transfer_date: transferDateIso,
    conversion_rate: paymentData?.conversionRate ?? null,
    conversion_date: conversionDateIso,
  };

  const { error } = await admin
    .from("payment_flow_finalize_records")
    .upsert(row, { onConflict: "payment_id", ignoreDuplicates: true });

  if (error) {
    logSupabaseClientError("upsertFlowFinalizeRecord", error, { payment_id_prefix: paymentId.slice(0, 8) });
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Flow returns dates in `"YYYY-MM-DD HH:mm:ss"` (no timezone) — interpret as instituto local time
 * via the analytics timezone if the server has it configured. Fallback: parse as ISO if it has T.
 */
function parseFlowDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.includes("T")) {
    const t = Date.parse(trimmed);
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  }
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) {
    const t = Date.parse(trimmed);
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  }
  const [, y, mo, d, h, mi, s] = m;
  const t = Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}
