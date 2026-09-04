import type { SupabaseClient } from "@supabase/supabase-js";
import { flowFetchPaymentStatus } from "@/lib/payment-gateways/flow/flowFetchPaymentStatus";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  markShopOrderPaid,
  type MarkShopOrderPaidResult,
  type ShopMarkPaidAdmin,
} from "@/lib/shop/markShopOrderPaid";

const FLOW_PAID_STATUS = 2;

export async function finalizeShopOrderFromFlowGateway(input: {
  admin: SupabaseClient;
  apiBaseUrl: string;
  apiKey: string;
  secretKey: string;
  token: string;
}): Promise<MarkShopOrderPaidResult | { ok: true; skipped: string } | { ok: false }> {
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
    .select("shop_order_id")
    .eq("commerce_ref", commerceOrder)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("finalizeShopOrderFromFlow:lookup", error, { commerceOrder });
    return { ok: false };
  }
  const orderId =
    data && typeof (data as { shop_order_id?: unknown }).shop_order_id === "string"
      ? String((data as { shop_order_id: string }).shop_order_id)
      : "";
  if (!orderId) return { ok: true, skipped: "not_found" };

  return markShopOrderPaid({ admin: input.admin as unknown as ShopMarkPaidAdmin, orderId });
}
