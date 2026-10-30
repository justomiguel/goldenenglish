import type { SupabaseClient } from "@supabase/supabase-js";
import { parseCourseOrderGatewayReference } from "@/lib/courses/courseOrderGatewayReference";
import { markCourseOrderPaid } from "@/lib/courses/markCourseOrderPaid";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";

export async function finalizeCourseOrderFromMercadoPago(input: {
  admin: SupabaseClient;
  accessToken: string;
  mpPaymentId: string | number;
}): Promise<{ ok: true; skipped?: string } | { ok: false }> {
  const fetched = await mercadoPagoGetPayment({
    accessToken: input.accessToken,
    paymentId: input.mpPaymentId,
  });
  if (!fetched.ok) return { ok: false };
  if (fetched.data.status !== "approved") return { ok: true, skipped: "mp_not_approved" };

  const orderId = parseCourseOrderGatewayReference(fetched.data.external_reference);
  if (!orderId) return { ok: true, skipped: "not_found" };
  return markCourseOrderPaid(input.admin, orderId);
}
