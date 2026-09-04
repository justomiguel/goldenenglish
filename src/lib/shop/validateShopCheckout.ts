import type { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import {
  evaluateShopCheckoutLines,
  type ShopOrderItemSnapshot,
  type ShopVariantSnapshotRow,
} from "@/lib/shop/evaluateShopCheckoutLines";
import { shopGatewayIsConfigured } from "@/lib/shop/startShopGatewayPayment";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { ShopCheckoutFailCode, ShopCheckoutGateway, ShopCheckoutLine } from "@/lib/shop/types";

const VARIANT_SELECT =
  "id, stock, price, active, size, color, sku, shop_products(title, active)";

export type ValidateShopCheckoutResult =
  | { ok: true; currency: string; items: ShopOrderItemSnapshot[]; total: number }
  | { ok: false; code: ShopCheckoutFailCode };

export async function validateShopCheckout(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  gateway: ShopCheckoutGateway;
  lines: readonly ShopCheckoutLine[];
}): Promise<ValidateShopCheckoutResult> {
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
  return { ok: true, currency, items: evaluated.items, total: evaluated.total };
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
    logSupabaseClientError("validateShopCheckout:variants", error);
    return null;
  }
  return (data ?? []) as ShopVariantSnapshotRow[];
}
