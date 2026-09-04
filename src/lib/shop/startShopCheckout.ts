import type { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import {
  evaluateShopCheckoutLines,
  type ShopVariantSnapshotRow,
} from "@/lib/shop/evaluateShopCheckoutLines";
import { insertShopPendingOrder } from "@/lib/shop/insertShopPendingOrder";
import { shopGatewayIsConfigured, startShopGatewayPayment } from "@/lib/shop/startShopGatewayPayment";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type {
  ShopCheckoutGateway,
  ShopCheckoutLine,
  StartShopCheckoutResult,
} from "@/lib/shop/types";

const VARIANT_SELECT =
  "id, stock, price, active, size, color, sku, shop_products(title, active)";

export async function startShopCheckout(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  buyerId: string;
  buyerEmail: string;
  buyerRole: string;
  locale: string;
  gateway: ShopCheckoutGateway;
  lines: readonly ShopCheckoutLine[];
}): Promise<StartShopCheckoutResult> {
  if (input.buyerRole === "student") return { ok: false, code: "student_forbidden" };
  if (!(await loadMerchEnabled())) return { ok: false, code: "flag_off" };
  if (input.lines.length === 0) return { ok: false, code: "empty_cart" };

  const { currency } = await loadBillingCurrencySetting(input.admin);
  const gatewayReady = await shopGatewayIsConfigured({
    admin: input.admin,
    encryptionKey32: input.encryptionKey32,
    gateway: input.gateway,
    currency,
  });
  if (!gatewayReady) return { ok: false, code: "no_gateway" };

  const variants = await loadVariantRows(input.admin, input.lines.map((line) => line.variantId));
  if (!variants) return { ok: false, code: "inactive_variant" };
  const evaluated = evaluateShopCheckoutLines(input.lines, variants);
  if (!evaluated.ok) return evaluated;

  const inserted = await insertShopPendingOrder({
    admin: input.admin,
    buyerId: input.buyerId,
    buyerEmail: input.buyerEmail,
    currency,
    total: evaluated.total,
    gateway: input.gateway,
    items: evaluated.items,
  });
  if (!inserted.ok) return { ok: false, code: "inactive_variant" };

  const started = await startShopGatewayPayment({
    admin: input.admin,
    encryptionKey32: input.encryptionKey32,
    gateway: input.gateway,
    locale: input.locale,
    currency,
    amount: evaluated.total,
    title: evaluated.items[0]?.title || "Shop",
    payerEmail: input.buyerEmail,
    orderId: inserted.orderId,
    payToken: inserted.payToken,
  });
  if (!started.ok) return { ok: false, code: "no_gateway" };
  return { ok: true, redirectUrl: started.redirectUrl, payToken: inserted.payToken };
}

async function loadVariantRows(
  admin: SupabaseClient,
  ids: string[],
): Promise<ShopVariantSnapshotRow[] | null> {
  const { data, error } = await admin
    .from("shop_product_variants")
    .select(VARIANT_SELECT)
    .in("id", ids);
  if (error) {
    logSupabaseClientError("startShopCheckout:variants", error);
    return null;
  }
  return (data ?? []) as ShopVariantSnapshotRow[];
}
