import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function reservePaymentFlowCommerceReference(
  admin: SupabaseClient,
  input: { paymentId: string; year: number; month: number },
): Promise<{ ok: true; commerceRef: string } | { ok: false }> {
  const { data, error } = await admin.rpc("payment_flow_reserve_commerce_ref", {
    p_payment_id: input.paymentId,
    p_year: input.year,
    p_month: input.month,
  });

  if (error || typeof data !== "string" || data.trim().length < 12) {
    logSupabaseClientError("reservePaymentFlowCommerceReference:rpc", error ?? {}, {
      payment_id: input.paymentId,
    });
    return { ok: false };
  }

  return { ok: true, commerceRef: data.trim() };
}
