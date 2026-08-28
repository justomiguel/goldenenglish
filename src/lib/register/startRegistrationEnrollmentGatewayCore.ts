import type { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEnrollmentGatewayReference } from "@/lib/billing/parseMonthlyGatewayReference";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoCreatePreference } from "@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference";
import {
  loadFlowChileCredentialsPlain,
  flowChileApiBase,
} from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import { flowCreatePaymentOrder } from "@/lib/payment-gateways/flow/flowCreatePaymentOrder";
import { reservePaymentFlowCommerceReferenceForEnrollment } from "@/lib/payment-gateways/flow/reservePaymentFlowCommerceReference";
import {
  gatewayCountryForBillingCurrency,
  gatewaySupportsBillingCurrency,
} from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { isPubliclyReachableUrl } from "@/lib/site/isPubliclyReachableUrl";
import { logServerActionInvariantViolation } from "@/lib/logging/serverActionLog";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import {
  familyEmailFromPayLead,
  loadRegistrationPayLeadByToken,
  requestedSectionIdsFromLead,
} from "@/lib/register/loadRegistrationPayLeadByToken";

export type RegistrationEnrollmentGatewayMethod = "mercadopago" | "flow";

export type StartRegistrationEnrollmentGatewayResult =
  | { ok: true; redirectUrl: string }
  | {
      ok: false;
      code:
        | "not_found"
        | "enrolled"
        | "section_full"
        | "already_captured"
        | "no_amount"
        | "no_payer_email"
        | "currency_unsupported"
        | "method_unavailable"
        | "no_public_url"
        | "gateway_error";
    };

export async function startRegistrationEnrollmentGatewayCore(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  payToken: string;
  method: RegistrationEnrollmentGatewayMethod;
  locale: string;
}): Promise<StartRegistrationEnrollmentGatewayResult> {
  const lead = await loadRegistrationPayLeadByToken(input.admin, input.payToken);
  if (!lead) return { ok: false, code: "not_found" };
  if (lead.status === "enrolled") return { ok: false, code: "enrolled" };
  if (lead.feeCaptured) return { ok: false, code: "already_captured" };
  if (!(lead.snapshotTotal > 0)) return { ok: false, code: "no_amount" };

  const open = await requestedSectionsHaveOpenSeats(
    input.admin,
    requestedSectionIdsFromLead(lead),
  );
  if (!open) return { ok: false, code: "section_full" };

  const payerEmail = familyEmailFromPayLead(lead);
  if (!payerEmail) return { ok: false, code: "no_payer_email" };

  const currency = lead.snapshotCurrency.trim().toUpperCase();
  const country = gatewayCountryForBillingCurrency(currency);
  if (!country) return { ok: false, code: "currency_unsupported" };
  if (!gatewaySupportsBillingCurrency(input.method, currency)) {
    return { ok: false, code: "method_unavailable" };
  }

  const origin = getPublicSiteUrl();
  if (!origin) return { ok: false, code: "no_public_url" };
  const originStr = origin.toString();
  const amount = Math.round(lead.snapshotTotal);
  const title = `Matrícula ${lead.firstName} ${lead.lastName}`.trim();
  const returnUrl = new URL(
    `/${input.locale}/matricula/${input.payToken}`,
    originStr,
  );
  returnUrl.searchParams.set("paid", "1");

  if (input.method === "mercadopago") {
    return startMercadoPago({
      admin: input.admin,
      encryptionKey32: input.encryptionKey32,
      country,
      title,
      amount,
      currency,
      registrationId: lead.id,
      payerEmail,
      originStr,
      returnUrl: returnUrl.toString(),
    });
  }

  return startFlow({
    admin: input.admin,
    encryptionKey32: input.encryptionKey32,
    title,
    amount,
    currency,
    registrationId: lead.id,
    payerEmail,
    originStr,
    returnUrl: returnUrl.toString(),
  });
}

async function startMercadoPago(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  country: PaymentGatewayCountryCode;
  title: string;
  amount: number;
  currency: string;
  registrationId: string;
  payerEmail: string;
  originStr: string;
  returnUrl: string;
}): Promise<StartRegistrationEnrollmentGatewayResult> {
  const creds = await loadMercadoPagoCredentialsPlain(
    input.admin,
    input.encryptionKey32,
    input.country,
  );
  if (!creds?.enabled) return { ok: false, code: "method_unavailable" };

  const notificationUrl = new URL("/api/payments/mercadopago/webhook", input.originStr);
  notificationUrl.searchParams.set("country", input.country);
  notificationUrl.searchParams.set("purpose", "enrollment");

  const created = await mercadoPagoCreatePreference({
    accessToken: creds.accessToken,
    environment: creds.environment,
    title: input.title,
    unitPrice: input.amount,
    currencyId: input.currency,
    externalReference: buildEnrollmentGatewayReference(input.registrationId),
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
    logServerActionInvariantViolation(
      "startRegistrationEnrollmentGatewayCore:mp",
      created.error,
      { registration_id: input.registrationId },
    );
    return { ok: false, code: "gateway_error" };
  }
  return { ok: true, redirectUrl: created.redirectUrl };
}

async function startFlow(input: {
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  title: string;
  amount: number;
  currency: string;
  registrationId: string;
  payerEmail: string;
  originStr: string;
  returnUrl: string;
}): Promise<StartRegistrationEnrollmentGatewayResult> {
  const creds = await loadFlowChileCredentialsPlain(input.admin, input.encryptionKey32);
  if (!creds?.enabled) return { ok: false, code: "method_unavailable" };

  const reserved = await reservePaymentFlowCommerceReferenceForEnrollment(
    input.admin,
    input.registrationId,
  );
  if (!reserved.ok) return { ok: false, code: "gateway_error" };

  const urlConfirmation = new URL("/api/payments/flow/confirm", input.originStr);
  urlConfirmation.searchParams.set("purpose", "enrollment");

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
    logServerActionInvariantViolation(
      "startRegistrationEnrollmentGatewayCore:flow",
      created.error,
      { registration_id: input.registrationId },
    );
    return { ok: false, code: "gateway_error" };
  }
  return { ok: true, redirectUrl: `${created.url}?token=${encodeURIComponent(created.token)}` };
}
