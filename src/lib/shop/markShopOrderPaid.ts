import { logServerWarn, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { notifyShopEmail } from "@/lib/shop/notifyShopEmail";
import { absoluteUrlForRequest } from "@/lib/site/requestPublicUrl";
import { buildShopOrderPath } from "@/lib/site/publicSharePaths";
import type { Locale } from "@/types/i18n";

export type MarkShopOrderPaidResult =
  | { ok: true; alreadyPaid?: boolean }
  | { ok: false; code?: "insufficient_stock" };

type RpcError = { message?: string; code?: string } | null;

export type ShopMarkPaidAdmin = {
  rpc: (
    fn: string,
    args: { p_order_id: string },
  ) => PromiseLike<{ data: unknown; error: RpcError }>;
  from?: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
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

function shopOrderPaidPickupNote(locale: Locale): string {
  if (locale === "en") return "Pick up at the institute during opening hours.";
  return "Retiro en el instituto en horario de atención.";
}

async function notifyPaid(admin: ShopMarkPaidAdmin, orderId: string): Promise<void> {
  if (!admin.from) return;
  const { data, error } = await admin
    .from("shop_orders")
    .select("buyer_email, pay_token")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return;
  const row = data as { buyer_email?: unknown; pay_token?: unknown };
  const to = String(row.buyer_email ?? "").trim();
  const token = String(row.pay_token ?? "").trim();
  if (!to || !token) return;
  const locale: Locale = "es";
  const orderPath = buildShopOrderPath(locale, "", token);
  const orderUrl = (await absoluteUrlForRequest(orderPath))?.toString() ?? orderPath;
  await notifyShopEmail({
    to,
    key: "shop.order_paid",
    locale,
    vars: {
      orderUrl,
      pickupNote: shopOrderPaidPickupNote(locale),
    },
  });
}
