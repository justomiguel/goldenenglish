import type { SupabaseClient } from "@supabase/supabase-js";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { applyEnrollmentGatewayCapture } from "@/lib/register/applyEnrollmentGatewayCapture";

const FLOW_PAID_STATUS = 2;

export async function finalizeEnrollmentPaymentFromFlowGateway(input: {
  admin: SupabaseClient;
  apiBaseUrl: string;
  apiKey: string;
  secretKey: string;
  token: string;
}): Promise<{ ok: boolean; skipped?: string; studentId?: string }> {
  const status = await flowFetchPaymentStatus({
    apiBaseUrl: input.apiBaseUrl,
    apiKey: input.apiKey,
    secretKey: input.secretKey,
    token: input.token,
  });
  if (!status.ok) return { ok: false };
  if (status.data.status !== FLOW_PAID_STATUS) {
    return { ok: true, skipped: "flow_not_paid" };
  }

  const commerceOrder = status.data.commerceOrder?.trim() ?? "";
  const { data, error } = await input.admin
    .from("payment_flow_checkout_refs")
    .select("registration_id")
    .eq("commerce_ref", commerceOrder)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("finalizeEnrollmentPaymentFromFlow:lookup", error, {
      commerceOrder,
    });
    return { ok: false };
  }
  const registrationId =
    data && typeof (data as { registration_id?: unknown }).registration_id === "string"
      ? String((data as { registration_id: string }).registration_id)
      : "";
  if (!registrationId) return { ok: true, skipped: "not_found" };

  return applyEnrollmentGatewayCapture({
    admin: input.admin,
    registrationId,
    gatewayAmount: Number(status.data.amount),
    gatewayCurrency: String(status.data.currency ?? "CLP"),
    locale: "es",
  });
}
