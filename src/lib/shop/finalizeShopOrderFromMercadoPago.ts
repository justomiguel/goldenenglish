import type { SupabaseClient } from "@supabase/supabase-js";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { parseShopOrderGatewayReference } from "@/lib/shop/buildShopOrderGatewayReference";
import { markShopOrderPaid, type MarkShopOrderPaidResult } from "@/lib/shop/markShopOrderPaid";

export async function finalizeShopOrderFromMercadoPago(input: {
  admin: SupabaseClient;
  accessToken: string;
  mpPaymentId: string | number;
}): Promise<MarkShopOrderPaidResult | { ok: true; skipped: string } | { ok: false }> {
  const fetched = await mercadoPagoGetPayment({
    accessToken: input.accessToken,
    paymentId: input.mpPaymentId,
  });
  if (!fetched.ok) return { ok: false };
  if (fetched.data.status !== "approved") {
    return { ok: true, skipped: "mp_not_approved" };
  }

  const orderId = parseShopOrderGatewayReference(fetched.data.external_reference);
  if (!orderId) return { ok: true, skipped: "not_found" };

  return markShopOrderPaid({ admin: input.admin, orderId });
}
