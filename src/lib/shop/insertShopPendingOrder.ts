import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShopCheckoutGateway } from "@/lib/shop/types";
import type { ShopOrderItemSnapshot } from "@/lib/shop/evaluateShopCheckoutLines";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function insertShopPendingOrder(input: {
  admin: SupabaseClient;
  buyerId: string;
  buyerEmail: string;
  currency: string;
  total: number;
  gateway: ShopCheckoutGateway;
  items: readonly ShopOrderItemSnapshot[];
}): Promise<{ ok: true; orderId: string; payToken: string } | { ok: false }> {
  const { data: order, error } = await input.admin
    .from("shop_orders")
    .insert({
      buyer_id: input.buyerId,
      status: "pending_payment",
      currency: input.currency,
      total: input.total,
      buyer_email: input.buyerEmail,
      gateway_provider: input.gateway,
    })
    .select("id, pay_token")
    .single();
  if (error || !order?.id || !order.pay_token) {
    logSupabaseClientError("insertShopPendingOrder:order", error ?? {});
    return { ok: false };
  }
  const { error: itemsError } = await input.admin.from("shop_order_items").insert(
    input.items.map((item) => ({
      order_id: order.id,
      ...item,
    })),
  );
  if (itemsError) {
    logSupabaseClientError("insertShopPendingOrder:items", itemsError, { order_id: order.id });
    return { ok: false };
  }
  return { ok: true, orderId: order.id as string, payToken: order.pay_token as string };
}
