"use server";

import { redirect } from "next/navigation";
import { Buffer } from "node:buffer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { ensureGuestShopperParent } from "@/lib/shop/ensureGuestShopperParent";
import { startShopCheckout } from "@/lib/shop/startShopCheckout";
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
  let buyerRole: string;
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
    buyerRole = String(profile?.role ?? "");
    if (buyerRole === "student") return { ok: false, code: "student_forbidden" };
    buyerId = user.id;
    buyerEmail = (user.email ?? "").trim().toLowerCase();
  } else {
    const email = input.email?.trim() ?? "";
    if (!email) return { ok: false, code: "email_required" };
    const ensured = await ensureGuestShopperParent({ email, admin });
    if (ensured.kind === "wrong_role") return { ok: false, code: "student_forbidden" };
    buyerId = ensured.profileId;
    buyerEmail = email.trim().toLowerCase();
    buyerRole = "parent";
    guest =
      ensured.kind === "created"
        ? { kind: "created", tempPassword: ensured.tempPassword }
        : { kind: "existing_parent" };
  }

  let rawKey: Buffer;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    return { ok: false, code: "no_gateway" };
  }

  const result = await startShopCheckout({
    admin,
    encryptionKey32: rawKey,
    buyerId,
    buyerEmail,
    buyerRole,
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
    vars: { orderUrl },
  });
}
