import type { SupabaseClient } from "@supabase/supabase-js";
import { markCourseOrderPaid } from "@/lib/courses/markCourseOrderPaid";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";

const FLOW_PAID_STATUS = 2;

export async function finalizeCourseOrderFromFlowGateway(input: {
  admin: SupabaseClient;
  apiBaseUrl: string;
  apiKey: string;
  secretKey: string;
  token: string;
}): Promise<{ ok: true; skipped?: string } | { ok: false }> {
  const status = await flowFetchPaymentStatus({
    apiBaseUrl: input.apiBaseUrl,
    apiKey: input.apiKey,
    secretKey: input.secretKey,
    token: input.token,
  });
  if (!status.ok) return { ok: false };
  if (status.data.status !== FLOW_PAID_STATUS) return { ok: true, skipped: "flow_not_paid" };

  const commerceOrder = status.data.commerceOrder?.trim() ?? "";
  const { data, error } = await input.admin
    .from("payment_flow_checkout_refs")
    .select("course_order_id")
    .eq("commerce_ref", commerceOrder)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("finalizeCourseOrderFromFlow:lookup", error, { commerceOrder });
    return { ok: false };
  }
  const orderId = typeof data?.course_order_id === "string" ? data.course_order_id : "";
  if (!orderId) return { ok: true, skipped: "not_found" };
  return markCourseOrderPaid(input.admin, orderId);
}
