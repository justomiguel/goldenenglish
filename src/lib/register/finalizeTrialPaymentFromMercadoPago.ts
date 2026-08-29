import type { SupabaseClient } from "@supabase/supabase-js";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { parseMonthlyGatewayReference } from "@/lib/billing/parseMonthlyGatewayReference";
import { applyTrialFeeGatewayCapture } from "@/lib/register/applyTrialFeeGatewayCapture";
import { applyTrialConvertGatewayCapture } from "@/lib/register/applyTrialConvertGatewayCapture";

export async function finalizeTrialPaymentFromMercadoPago(input: {
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
  if (!ref || (ref.kind !== "trial" && ref.kind !== "join")) {
    return { ok: true, skipped: "not_found" };
  }
  const amount = Number(fetched.data.transaction_amount ?? 0);
  const currency = String(fetched.data.currency_id ?? "CLP");
  if (ref.kind === "join") {
    return applyTrialConvertGatewayCapture({
      admin: input.admin,
      registrationId: ref.registrationId,
      gatewayAmount: amount,
      gatewayCurrency: currency,
      locale: "es",
    });
  }
  return applyTrialFeeGatewayCapture({
    admin: input.admin,
    registrationId: ref.registrationId,
    gatewayAmount: amount,
    gatewayCurrency: currency,
  });
}
