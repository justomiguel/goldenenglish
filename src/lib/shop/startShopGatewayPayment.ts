import type { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoCreatePreference } from "@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference";
import {
  loadFlowChileCredentialsPlain,
  flowChileApiBase,
} from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import { reservePaymentFlowCommerceReferenceForMerch } from "@/lib/payment-gateways/flow/reservePaymentFlowCommerceReference";
import {
  gatewayCountryForBillingCurrency,
  gatewaySupportsBillingCurrency,
} from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { buildShopOrderPath } from "@/lib/site/publicSharePaths";
import { isPubliclyReachableUrl } from "@/lib/site/isPubliclyReachableUrl";
import { logServerActionInvariantViolation } from "@/lib/logging/serverActionLog";
import { buildShopOrderGatewayReference } from "@/lib/shop/buildShopOrderGatewayReference";
import type { ShopCheckoutGateway } from "@/lib/shop/types";

export async function shopGatewayIsConfigured(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  gateway: ShopCheckoutGateway;
  currency: string;
}): Promise<boolean> {
  const currency = input.currency.trim().toUpperCase();
  const country = gatewayCountryForBillingCurrency(currency);
  if (!country || !gatewaySupportsBillingCurrency(input.gateway, currency)) return false;
  if (input.gateway === "mercadopago") {
    const creds = await loadMercadoPagoCredentialsPlain(
      input.admin,
      input.encryptionKey32,
      country,
    );
    return Boolean(creds?.enabled);
  }
  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  return Boolean(creds?.enabled);
}

export async function startShopGatewayPayment(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  gateway: ShopCheckoutGateway;
  locale: string;
  currency: string;
  amount: number;
  title: string;
  payerEmail: string;
  orderId: string;
  payToken: string;
}): Promise<{ ok: true; redirectUrl: string } | { ok: false }> {
  const origin = await getRequestPublicSiteUrl();
  if (!origin) return { ok: false };
  const originStr = origin.toString();
  const returnUrl = new URL(
    buildShopOrderPath(input.locale, input.title, input.payToken),
    originStr,
  ).toString();
  const amount = Math.round(input.amount);
  if (!(amount > 0)) return { ok: false };

  if (input.gateway === "mercadopago") {
    return startMercadoPago({ ...input, originStr, returnUrl, amount });
  }
  return startFlow({ ...input, originStr, returnUrl, amount });
}

async function startMercadoPago(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  currency: string;
  amount: number;
  title: string;
  payerEmail: string;
  orderId: string;
  originStr: string;
  returnUrl: string;
}): Promise<{ ok: true; redirectUrl: string } | { ok: false }> {
  const country = gatewayCountryForBillingCurrency(input.currency);
  if (!country) return { ok: false };
  const creds = await loadMercadoPagoCredentialsPlain(
    input.admin,
    input.encryptionKey32,
    country,
  );
  if (!creds?.enabled) return { ok: false };
  const notificationUrl = new URL("/api/payments/mercadopago/webhook", input.originStr);
  notificationUrl.searchParams.set("country", country);
  notificationUrl.searchParams.set("purpose", "merch");
  const created = await mercadoPagoCreatePreference({
    accessToken: creds.accessToken,
    environment: creds.environment,
    title: input.title,
    unitPrice: input.amount,
    currencyId: input.currency,
    externalReference: buildShopOrderGatewayReference(input.orderId),
    payerEmail: input.payerEmail,
    notificationUrl: notificationUrl.toString(),
    backUrls: {
      success: input.returnUrl,
      failure: input.returnUrl,
      pending: input.returnUrl,
    },
    autoReturn: isPubliclyReachableUrl(input.originStr),
  });
  if (!created.ok) {
    logServerActionInvariantViolation("startShopGatewayPayment:mp", created.error, {
      shop_order_id: input.orderId,
    });
    return { ok: false };
  }
  return { ok: true, redirectUrl: created.redirectUrl };
}

async function startFlow(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  currency: string;
  amount: number;
  title: string;
  payerEmail: string;
  orderId: string;
  originStr: string;
  returnUrl: string;
}): Promise<{ ok: true; redirectUrl: string } | { ok: false }> {
  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  if (!creds?.enabled) return { ok: false };
  const reserved = await reservePaymentFlowCommerceReferenceForMerch(input.admin, input.orderId);
  if (!reserved.ok) return { ok: false };
  const urlConfirmation = new URL("/api/payments/flow/confirm", input.originStr);
  urlConfirmation.searchParams.set("purpose", "merch");
  const created = await flowCreatePaymentOrder({
    apiBaseUrl: flowChileApiBase(creds),
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    commerceOrder: reserved.commerceRef,
    subject: input.title,
    currency: input.currency,
    amount: input.amount,
    email: input.payerEmail,
    urlConfirmation: urlConfirmation.toString(),
    urlReturn: input.returnUrl,
  });
  if (!created.ok) {
    logServerActionInvariantViolation("startShopGatewayPayment:flow", created.error, {
      shop_order_id: input.orderId,
    });
    return { ok: false };
  }
  return { ok: true, redirectUrl: `${created.url}?token=${encodeURIComponent(created.token)}` };
}
