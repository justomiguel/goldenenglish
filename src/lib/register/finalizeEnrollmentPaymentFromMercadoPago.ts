import type { SupabaseClient } from "@supabase/supabase-js";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { parseMonthlyGatewayReference } from "@/lib/billing/parseMonthlyGatewayReference";
import { applyEnrollmentGatewayCapture } from "@/lib/register/applyEnrollmentGatewayCapture";

export async function finalizeEnrollmentPaymentFromMercadoPago(input: {
  admin: SupabaseClient;
  accessToken: string;
  mpPaymentId: string | number;
}): Promise<{ ok: boolean; skipped?: string; studentId?: string }> {
  const fetched = await mercadoPagoGetPayment({
    accessToken: input.accessToken,
    paymentId: input.mpPaymentId,
  });
  if (!fetched.ok) return { ok: false };
  if (fetched.data.status !== "approved") {
    return { ok: true, skipped: "mp_not_approved" };
  }

  const ref = parseMonthlyGatewayReference(fetched.data.external_reference);
  if (!ref || ref.kind !== "enrollment") {
    return { ok: true, skipped: "not_found" };
  }

  return applyEnrollmentGatewayCapture({
    admin: input.admin,
    registrationId: ref.registrationId,
    gatewayAmount: Number(fetched.data.transaction_amount ?? 0),
    gatewayCurrency: String(fetched.data.currency_id ?? "CLP"),
    locale: "es",
  });
}
