import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { loadEnabledGatewaysForBillingCurrency } from "@/lib/payment-gateways/loadEnabledGatewaysForBillingCurrency";
import { formatShopMoney } from "@/lib/shop/formatShopMoney";
import type { ShopCheckoutGateway } from "@/lib/shop/types";

export type ShopCheckoutPreviewLine = {
  variantId: string;
  title: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  priceLabel: string;
};

export type ShopCheckoutSession = {
  role: string | null;
  requireEmail: boolean;
};

export type ShopCheckoutPreview = {
  currency: string;
  line: ShopCheckoutPreviewLine | null;
  gateways: ShopCheckoutGateway[];
  session: ShopCheckoutSession;
};

export async function loadShopCheckoutPreview(
  locale: string,
  variantId: string,
): Promise<ShopCheckoutPreview> {
  const supabase = await createClient();
  const { currency } = await loadBillingCurrencySetting(supabase);
  const [gateways, session, line] = await Promise.all([
    loadEnabledGatewaysForBillingCurrency(supabase, currency),
    loadCheckoutSession(supabase),
    loadCheckoutLine(supabase, variantId, currency, locale),
  ]);
  return {
    currency,
    line,
    gateways: gateways.map((row) => row.provider),
    session,
  };
}

async function loadCheckoutSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ShopCheckoutSession> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { role: null, requireEmail: true };
  const admin = await createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = typeof data?.role === "string" ? data.role : null;
  return { role, requireEmail: false };
}

async function loadCheckoutLine(
  supabase: Awaited<ReturnType<typeof createClient>>,
  variantId: string,
  currency: string,
  locale: string,
): Promise<ShopCheckoutPreviewLine | null> {
  const id = variantId.trim();
  if (!id) return null;
  const { data } = await supabase
    .from("shop_product_variants")
    .select("id, price, size, color, shop_products(title, active)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const product = Array.isArray(data.shop_products) ? data.shop_products[0] : data.shop_products;
  const title = product && typeof product === "object" && "title" in product
    ? String(product.title)
    : "";
  const unitPrice = Number(data.price);
  return {
    variantId: data.id,
    title,
    size: String(data.size),
    color: String(data.color),
    unitPrice,
    quantity: 1,
    priceLabel: formatShopMoney(unitPrice, currency, locale),
  };
}
