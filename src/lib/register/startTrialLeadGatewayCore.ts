import type { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildJoinGatewayReference,
  buildTrialFeeGatewayReference,
} from "@/lib/billing/parseMonthlyGatewayReference";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoCreatePreference } from "@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference";
import {
  flowChileApiBase,
  loadFlowChileCredentialsPlain,
} from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import {
  gatewayCountryForBillingCurrency,
  gatewaySupportsBillingCurrency,
} from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { isPubliclyReachableUrl } from "@/lib/site/isPubliclyReachableUrl";
import { logServerActionInvariantViolation, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { StartRegistrationEnrollmentGatewayResult } from "@/lib/register/startRegistrationEnrollmentGatewayCore";

export async function startTrialLeadGatewayCore(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  method: "flow" | "mercadopago";
  locale: string;
  purpose: "trial" | "join";
  registrationId: string;
  amount: number;
  currency: string;
  title: string;
  payerEmail: string;
  returnPath: string;
}): Promise<StartRegistrationEnrollmentGatewayResult> {
  if (!(input.amount > 0)) return { ok: false, code: "no_amount" };
  if (!input.payerEmail) return { ok: false, code: "no_payer_email" };
  const currency = input.currency.trim().toUpperCase();
  const country = gatewayCountryForBillingCurrency(currency);
  if (!country) return { ok: false, code: "currency_unsupported" };
  if (!gatewaySupportsBillingCurrency(input.method, currency)) {
    return { ok: false, code: "method_unavailable" };
  }
  const origin = getPublicSiteUrl();
  if (!origin) return { ok: false, code: "no_public_url" };
  const originStr = origin.toString();
  const returnUrl = new URL(input.returnPath, originStr);
  returnUrl.searchParams.set("paid", "1");
  const amount = Math.round(input.amount);

  if (input.method === "mercadopago") {
    const creds = await loadMercadoPagoCredentialsPlain(
      input.admin,
      input.encryptionKey32,
      country,
    );
    if (!creds?.enabled) return { ok: false, code: "method_unavailable" };
    const notificationUrl = new URL("/api/payments/mercadopago/webhook", originStr);
    notificationUrl.searchParams.set("country", country);
    notificationUrl.searchParams.set("purpose", input.purpose);
    const created = await mercadoPagoCreatePreference({
      accessToken: creds.accessToken,
      environment: creds.environment,
      title: input.title,
      unitPrice: amount,
      currencyId: currency,
      externalReference:
        input.purpose === "join"
          ? buildJoinGatewayReference(input.registrationId)
          : buildTrialFeeGatewayReference(input.registrationId),
      payerEmail: input.payerEmail,
      notificationUrl: notificationUrl.toString(),
      backUrls: {
        success: returnUrl.toString(),
        failure: returnUrl.toString(),
        pending: returnUrl.toString(),
      },
      autoReturn: isPubliclyReachableUrl(originStr),
    });
    if (!created.ok) {
      logServerActionInvariantViolation("startTrialLeadGatewayCore:mp", created.error, {
        registration_id: input.registrationId,
      });
      return { ok: false, code: "gateway_error" };
    }
    return { ok: true, redirectUrl: created.redirectUrl };
  }

  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  if (!creds?.enabled) return { ok: false, code: "method_unavailable" };
  const rpc =
    input.purpose === "join"
      ? "payment_flow_reserve_commerce_ref_join"
      : "payment_flow_reserve_commerce_ref_trial";
  const { data, error } = await input.admin.rpc(rpc, {
    p_registration_id: input.registrationId,
  });
  if (error || typeof data !== "string" || data.trim().length < 12) {
    logSupabaseClientError("startTrialLeadGatewayCore:reserve", error ?? {}, {
      registration_id: input.registrationId,
    });
    return { ok: false, code: "gateway_error" };
  }
  const urlConfirmation = new URL("/api/payments/flow/confirm", originStr);
  urlConfirmation.searchParams.set("purpose", input.purpose);
  const created = await flowCreatePaymentOrder({
    apiBaseUrl: flowChileApiBase(creds),
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    commerceOrder: data.trim(),
    subject: input.title,
    currency,
    amount,
    email: input.payerEmail,
    urlConfirmation: urlConfirmation.toString(),
    urlReturn: returnUrl.toString(),
  });
  if (!created.ok) {
    logServerActionInvariantViolation("startTrialLeadGatewayCore:flow", created.error, {
      registration_id: input.registrationId,
    });
    return { ok: false, code: "gateway_error" };
  }
  return { ok: true, redirectUrl: `${created.url}?token=${encodeURIComponent(created.token)}` };
}
