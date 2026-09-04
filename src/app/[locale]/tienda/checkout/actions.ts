"use server";

import { redirect } from "next/navigation";
import { Buffer } from "node:buffer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { ensureGuestShopperParent } from "@/lib/shop/ensureGuestShopperParent";
import { shopCheckoutBuyerFailCode } from "@/lib/shop/shopCheckoutBuyerRole";
import { startShopCheckout } from "@/lib/shop/startShopCheckout";
import { validateShopCheckout } from "@/lib/shop/validateShopCheckout";
import { notifyShopEmail } from "@/lib/shop/notifyShopEmail";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import type { ShopCheckoutFailCode, ShopCheckoutGateway, ShopCheckoutLine } from "@/lib/shop/types";

export type StartShopCheckoutActionResult =
  | { ok: true }
  | { ok: false; code: ShopCheckoutFailCode | "email_required" };

export async function startShopCheckoutAction(input: {
  locale: string;
  gateway: ShopCheckoutGateway;
  lines: ShopCheckoutLine[];
  email?: string;
}): Promise<StartShopCheckoutActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();

  let buyerId: string;
  let buyerEmail: string;
  let guest:
    | { kind: "created"; tempPassword: string }
    | { kind: "existing_parent" }
    | null = null;

  if (user) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const roleFail = shopCheckoutBuyerFailCode(String(profile?.role ?? ""));
    if (roleFail) return { ok: false, code: roleFail };
    buyerId = user.id;
    buyerEmail = (user.email ?? "").trim().toLowerCase();
  } else {
    const email = input.email?.trim() ?? "";
    if (!email) return { ok: false, code: "email_required" };
    buyerId = "";
    buyerEmail = email.trim().toLowerCase();
  }

  let rawKey: Buffer;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    return { ok: false, code: "no_gateway" };
  }

  const preview = await validateShopCheckout({
    admin,
    encryptionKey32: rawKey,
    gateway: input.gateway,
    lines: input.lines,
  });
  if (!preview.ok) return preview;

  if (!user) {
    const ensured = await ensureGuestShopperParent({ email: buyerEmail, admin });
    if (ensured.kind === "wrong_role") return { ok: false, code: "wrong_role" };
    buyerId = ensured.profileId;
    guest =
      ensured.kind === "created"
        ? { kind: "created", tempPassword: ensured.tempPassword }
        : { kind: "existing_parent" };
  }

  const result = await startShopCheckout({
    admin,
    encryptionKey32: rawKey,
    buyerId,
    buyerEmail,
    buyerRole: "parent",
    locale: input.locale,
    gateway: input.gateway,
    lines: input.lines,
  });
  if (!result.ok) return result;

  await sendGuestShopMail({
    locale: input.locale,
    email: buyerEmail,
    guest,
    payToken: result.payToken,
  });
  redirect(result.redirectUrl);
}

async function sendGuestShopMail(input: {
  locale: string;
  email: string;
  payToken: string;
  guest: { kind: "created"; tempPassword: string } | { kind: "existing_parent" } | null;
}): Promise<void> {
  if (!input.guest) return;
  const origin = getPublicSiteUrl()?.toString() ?? "";
  const orderUrl = `${origin}/${input.locale}/tienda/pedido/${input.payToken}`;
  if (input.guest.kind === "created") {
    await notifyShopEmail({
      to: input.email,
      key: "shop.guest_account_created",
      locale: input.locale,
      vars: {
        password: input.guest.tempPassword,
        signInUrl: `${origin}/${input.locale}/login`,
        orderUrl,
      },
    });
    return;
  }
  await notifyShopEmail({
    to: input.email,
    key: "shop.order_started",
    locale: input.locale,
    vars: { orderUrl },
  });
}
