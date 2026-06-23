import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Buffer } from "node:buffer";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoCreatePreference } from "@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference";
import {
  loadFlowChileCredentialsPlain,
  flowChileApiBase,
} from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import {
  gatewayCountryForBillingCurrency,
  gatewaySupportsBillingCurrency,
} from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import {
  normalizeEventRegistrationDni,
  normalizeEventRegistrationEmail,
} from "@/lib/events/eventTransferReceiptLimits";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { isPubliclyReachableUrl } from "@/lib/site/isPubliclyReachableUrl";
import {
  logServerActionInvariantViolation,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { buildEventPaymentReturnUrl } from "@/lib/events/buildEventPaymentReturnUrl";

export type EventGatewayMethod = "mercadopago" | "flow";

export interface StartEventGatewayPaymentInput {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  slug: string;
  paymentId: string;
  method: EventGatewayMethod;
  email: string;
  dniOrPassport: string;
  locale: string;
}

export type StartEventGatewayPaymentResult =
  | { ok: true; redirectUrl: string }
  | {
      ok: false;
      code:
        | "payment_not_found"
        | "identity_mismatch"
        | "payment_not_pending"
        | "currency_unsupported"
        | "method_unavailable"
        | "no_public_url"
        | "gateway_error";
    };

interface PaymentRow {
  id: string;
  status: string;
  amount: number;
  currency: string;
  event_attendees: {
    email: string;
    dni_or_passport: string;
    event_id: string;
    events: { slug: string; title: string };
  };
}

async function loadPayment(
  admin: SupabaseClient,
  paymentId: string,
): Promise<PaymentRow | null> {
  const { data, error } = await admin
    .from("event_payments")
    .select(
      "id, status, amount, currency, event_attendees!inner(email, dni_or_passport, event_id, events!inner(slug, title))",
    )
    .eq("id", paymentId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("startEventGatewayPaymentCore:loadPayment", error, { paymentId });
    return null;
  }
  return (data as PaymentRow | null) ?? null;
}

/** Creates the gateway checkout for a pending event payment and returns the redirect URL. */
export async function startEventGatewayPaymentCore(
  input: StartEventGatewayPaymentInput,
): Promise<StartEventGatewayPaymentResult> {
  const payment = await loadPayment(input.admin, input.paymentId);
  if (!payment) return { ok: false, code: "payment_not_found" };

  const attendee = payment.event_attendees;
  if (attendee.events.slug !== input.slug) {
    return { ok: false, code: "payment_not_found" };
  }

  const emailOk =
    normalizeEventRegistrationEmail(attendee.email) ===
    normalizeEventRegistrationEmail(input.email);
  const dniOk =
    normalizeEventRegistrationDni(attendee.dni_or_passport) ===
    normalizeEventRegistrationDni(input.dniOrPassport);
  if (!emailOk || !dniOk) {
    return { ok: false, code: "identity_mismatch" };
  }

  if (payment.status !== "pending") {
    return { ok: false, code: "payment_not_pending" };
  }

  const currency = String(payment.currency).trim().toUpperCase();
  const country = gatewayCountryForBillingCurrency(currency);
  if (!country) return { ok: false, code: "currency_unsupported" };
  if (!gatewaySupportsBillingCurrency(input.method, currency)) {
    return { ok: false, code: "method_unavailable" };
  }

  const origin = getPublicSiteUrl();
  if (!origin) return { ok: false, code: "no_public_url" };
  const originStr = origin.toString();

  const amount = Math.round(Number(payment.amount));
  const title = attendee.events.title || "Evento";
  const externalReference = `event_payment:${payment.id}`;

  if (input.method === "mercadopago") {
    const creds = await loadMercadoPagoCredentialsPlain(input.admin, input.encryptionKey32, country);
    if (!creds?.enabled) return { ok: false, code: "method_unavailable" };

    const notificationUrl = new URL("/api/payments/mercadopago/webhook", origin);
    notificationUrl.searchParams.set("country", country);
    notificationUrl.searchParams.set("purpose", "event");

    const created = await mercadoPagoCreatePreference({
      accessToken: creds.accessToken,
      environment: creds.environment,
      title,
      unitPrice: amount,
      currencyId: currency,
      externalReference,
      payerEmail: normalizeEventRegistrationEmail(input.email),
      notificationUrl: notificationUrl.toString(),
      backUrls: {
        success: buildEventPaymentReturnUrl(originStr, input.locale, input.slug, "success"),
        failure: buildEventPaymentReturnUrl(originStr, input.locale, input.slug, "failure"),
        pending: buildEventPaymentReturnUrl(originStr, input.locale, input.slug, "pending"),
      },
      autoReturn: isPubliclyReachableUrl(originStr),
    });
    if (!created.ok) {
      logServerActionInvariantViolation(
        "startEventGatewayPaymentCore:mpCreatePreference",
        created.error,
        { payment_id: payment.id },
      );
      return { ok: false, code: "gateway_error" };
    }

    await input.admin
      .from("event_payments")
      .update({ mp_preference_id: created.preferenceId, gateway_provider: "mercadopago" })
      .eq("id", payment.id)
      .eq("status", "pending");

    return { ok: true, redirectUrl: created.redirectUrl };
  }

  // Flow
  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  if (!creds?.enabled) return { ok: false, code: "method_unavailable" };

  const urlConfirmation = new URL("/api/payments/flow/confirm", origin);
  urlConfirmation.searchParams.set("purpose", "event");
  const urlReturn = new URL("/api/events/payment-return", origin);
  urlReturn.searchParams.set("locale", input.locale);
  urlReturn.searchParams.set("slug", input.slug);
  urlReturn.searchParams.set("status", "pending");

  const created = await flowCreatePaymentOrder({
    apiBaseUrl: flowChileApiBase(creds),
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    commerceOrder: `${externalReference}:${Date.now().toString(36)}`,
    subject: title,
    currency,
    amount,
    email: normalizeEventRegistrationEmail(input.email),
    urlConfirmation: urlConfirmation.toString(),
    urlReturn: urlReturn.toString(),
  });
  if (!created.ok) {
    logServerActionInvariantViolation(
      "startEventGatewayPaymentCore:flowCreatePaymentOrder",
      created.error,
      { payment_id: payment.id },
    );
    return { ok: false, code: "gateway_error" };
  }

  await input.admin
    .from("event_payments")
    .update({ gateway_provider: "flow" })
    .eq("id", payment.id)
    .eq("status", "pending");

  return { ok: true, redirectUrl: `${created.url}?token=${encodeURIComponent(created.token)}` };
}
