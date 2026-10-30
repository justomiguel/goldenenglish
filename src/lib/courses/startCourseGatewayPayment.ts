import type { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { buildCourseOrderGatewayReference } from "@/lib/courses/courseOrderGatewayReference";
import { logServerActionInvariantViolation, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { gatewayCountryForBillingCurrency } from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import { flowChileApiBase, loadFlowChileCredentialsPlain } from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoCreatePreference } from "@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference";
import { shopGatewayIsConfigured } from "@/lib/shop/startShopGatewayPayment";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { isPubliclyReachableUrl } from "@/lib/site/isPubliclyReachableUrl";
import type { ShopCheckoutGateway } from "@/lib/shop/types";

async function reserveCourseCommerceRef(
  admin: SupabaseClient,
  courseOrderId: string,
): Promise<string | null> {
  const { data, error } = await admin.rpc("payment_flow_reserve_commerce_ref_course", {
    p_course_order_id: courseOrderId,
  });
  if (error || typeof data !== "string" || data.trim().length < 12) {
    logSupabaseClientError("reserveCourseCommerceRef", error ?? {}, { courseOrderId });
    return null;
  }
  return data.trim();
}

export async function startCourseGatewayPayment(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  gateway: ShopCheckoutGateway;
  locale: string;
  amount: number;
  title: string;
  payerEmail: string;
  orderId: string;
}): Promise<{ ok: true; redirectUrl: string } | { ok: false; code: "no_gateway" }> {
  const { currency } = await loadBillingCurrencySetting(input.admin);
  const ready = await shopGatewayIsConfigured({
    admin: input.admin,
    encryptionKey32: input.encryptionKey32,
    gateway: input.gateway,
    currency,
  });
  if (!ready) return { ok: false, code: "no_gateway" };

  const origin = await getRequestPublicSiteUrl();
  if (!origin) return { ok: false, code: "no_gateway" };
  const originStr = origin.toString();
  const returnUrl = new URL(`/${input.locale}/dashboard/student/progress?tab=courses`, originStr).toString();
  const amount = Math.round(input.amount);
  if (!(amount > 0)) return { ok: false, code: "no_gateway" };

  if (input.gateway === "mercadopago") {
    return startMercadoPago({ ...input, currency, originStr, returnUrl, amount });
  }
  return startFlow({ ...input, currency, originStr, returnUrl, amount });
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
}): Promise<{ ok: true; redirectUrl: string } | { ok: false; code: "no_gateway" }> {
  const country = gatewayCountryForBillingCurrency(input.currency);
  if (!country) return { ok: false, code: "no_gateway" };
  const creds = await loadMercadoPagoCredentialsPlain(input.admin, input.encryptionKey32, country);
  if (!creds?.enabled) return { ok: false, code: "no_gateway" };
  const notificationUrl = new URL("/api/payments/mercadopago/webhook", input.originStr);
  notificationUrl.searchParams.set("country", country);
  notificationUrl.searchParams.set("purpose", "course");
  const created = await mercadoPagoCreatePreference({
    accessToken: creds.accessToken,
    environment: creds.environment,
    title: input.title,
    unitPrice: input.amount,
    currencyId: input.currency,
    externalReference: buildCourseOrderGatewayReference(input.orderId),
    payerEmail: input.payerEmail,
    notificationUrl: notificationUrl.toString(),
    backUrls: { success: input.returnUrl, failure: input.returnUrl, pending: input.returnUrl },
    autoReturn: isPubliclyReachableUrl(input.originStr),
  });
  if (!created.ok) {
    logServerActionInvariantViolation("startCourseGatewayPayment:mp", created.error, { courseOrderId: input.orderId });
    return { ok: false, code: "no_gateway" };
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
}): Promise<{ ok: true; redirectUrl: string } | { ok: false; code: "no_gateway" }> {
  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  if (!creds?.enabled) return { ok: false, code: "no_gateway" };
  const commerceRef = await reserveCourseCommerceRef(input.admin, input.orderId);
  if (!commerceRef) return { ok: false, code: "no_gateway" };
  const urlConfirmation = new URL("/api/payments/flow/confirm", input.originStr);
  urlConfirmation.searchParams.set("purpose", "course");
  const created = await flowCreatePaymentOrder({
    apiBaseUrl: flowChileApiBase(creds),
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    commerceOrder: commerceRef,
    subject: input.title,
    currency: input.currency,
    amount: input.amount,
    email: input.payerEmail,
    urlConfirmation: urlConfirmation.toString(),
    urlReturn: input.returnUrl,
  });
  if (!created.ok) {
    logServerActionInvariantViolation("startCourseGatewayPayment:flow", created.error, { courseOrderId: input.orderId });
    return { ok: false, code: "no_gateway" };
  }
  return { ok: true, redirectUrl: `${created.url}?token=${encodeURIComponent(created.token)}` };
}
