import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { expireStaleShopOrders } from "@/lib/shop/expireStaleShopOrders";
import { mapPublicShopOrder, type PublicShopOrder } from "@/lib/shop/mapPublicShopOrder";

const ORDER_SELECT =
  "id, status, currency, total, paid_at, ready_at, picked_up_at, expired_at, shop_order_items(title, size, color, sku, quantity, unit_price)";

export async function loadShopOrderByPayToken(token: string): Promise<PublicShopOrder | null> {
  const payToken = token.trim();
  if (!payToken) return null;
  await expireStaleShopOrders();
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("shop_orders")
    .select(ORDER_SELECT)
    .eq("pay_token", payToken)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("loadShopOrderByPayToken", error);
    return null;
  }
  if (!data) return null;
  return mapPublicShopOrder(data);
}
