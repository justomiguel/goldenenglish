import type { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insertShopPendingOrder } from "@/lib/shop/insertShopPendingOrder";
import { shopCheckoutBuyerFailCode } from "@/lib/shop/shopCheckoutBuyerRole";
import { startShopGatewayPayment } from "@/lib/shop/startShopGatewayPayment";
import { validateShopCheckout } from "@/lib/shop/validateShopCheckout";
import type {
  ShopCheckoutGateway,
  ShopCheckoutLine,
  StartShopCheckoutResult,
} from "@/lib/shop/types";

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
  const roleFail = shopCheckoutBuyerFailCode(input.buyerRole);
  if (roleFail) return { ok: false, code: roleFail };

  const validated = await validateShopCheckout({
    admin: input.admin,
    encryptionKey32: input.encryptionKey32,
    gateway: input.gateway,
    lines: input.lines,
  });
  if (!validated.ok) return validated;

  const inserted = await insertShopPendingOrder({
    admin: input.admin,
    buyerId: input.buyerId,
    buyerEmail: input.buyerEmail,
    currency: validated.currency,
    total: validated.total,
    gateway: input.gateway,
    items: validated.items,
  });
  if (!inserted.ok) return { ok: false, code: "inactive_variant" };

  const started = await startShopGatewayPayment({
    admin: input.admin,
    encryptionKey32: input.encryptionKey32,
    gateway: input.gateway,
    locale: input.locale,
    currency: validated.currency,
    amount: validated.total,
    title: validated.items[0]?.title || "Shop",
    payerEmail: input.buyerEmail,
    orderId: inserted.orderId,
    payToken: inserted.payToken,
  });
  if (!started.ok) return { ok: false, code: "no_gateway" };
  return { ok: true, redirectUrl: started.redirectUrl, payToken: inserted.payToken };
}
