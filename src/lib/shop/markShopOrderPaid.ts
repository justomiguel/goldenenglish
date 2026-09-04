import { logServerWarn, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { notifyShopEmail } from "@/lib/shop/notifyShopEmail";

export type MarkShopOrderPaidResult =
  | { ok: true; alreadyPaid?: boolean }
  | { ok: false; code?: "insufficient_stock" };

type RpcError = { message?: string; code?: string } | null;

export type ShopMarkPaidAdmin = {
  rpc: (
    fn: string,
    args: { p_order_id: string },
  ) => Promise<{ data: unknown; error: RpcError }>;
  from?: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

export async function markShopOrderPaid(input: {
  admin: ShopMarkPaidAdmin;
  orderId: string;
}): Promise<MarkShopOrderPaidResult> {
  const { data, error } = await input.admin.rpc("shop_mark_paid_and_decrement_stock", {
    p_order_id: input.orderId,
  });
  if (error) {
    logSupabaseClientError("markShopOrderPaid", error, { orderId: input.orderId });
    return { ok: false };
  }
  if (data === "already_paid") return { ok: true, alreadyPaid: true };
  if (data === "insufficient_stock") {
    logServerWarn("markShopOrderPaid:insufficient_stock", { orderId: input.orderId });
    return { ok: false, code: "insufficient_stock" };
  }
  if (data !== "paid") return { ok: false };
  await notifyPaid(input.admin, input.orderId);
  return { ok: true };
}

async function notifyPaid(admin: ShopMarkPaidAdmin, orderId: string): Promise<void> {
  if (!admin.from) return;
  const { data, error } = await admin
    .from("shop_orders")
    .select("buyer_email")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return;
  const to = String((data as { buyer_email?: unknown }).buyer_email ?? "").trim();
  if (!to) return;
  await notifyShopEmail({ to, key: "shop.order_paid" });
}
