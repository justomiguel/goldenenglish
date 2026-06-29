import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import {
  loadFlowChileCredentialsPlain,
  flowChileApiBase,
} from "@/lib/payment-gateways/flow/loadFlowChileCredentialsPlain";
import type { SupabaseClient } from "@supabase/supabase-js";
import { gatewayCountryForBillingCurrency } from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import { finalizeEventPaymentFromMercadoPago } from "@/lib/events/server/finalizeEventPaymentFromMercadoPago";
import { finalizeEventPaymentFromFlowGateway } from "@/lib/events/server/finalizeEventPaymentFromFlowGateway";
import { parseEventGatewayReference } from "@/lib/events/parseEventGatewayReference";
import { loadEventAttendeeGatewayContext } from "@/lib/events/server/loadEventAttendeeGatewayContext";
import type { EventPaymentReturnStatus } from "@/lib/events/buildEventPaymentReturnUrl";
import { logServerException, logServerWarn } from "@/lib/logging/serverActionLog";

function firstParam(raw: string | null | undefined): string {
  return raw?.trim() ?? "";
}

/**
 * Resolves the billing currency for the gateway return.
 *
 * Deferred-creation flow: the event_payments row may not exist yet at return time, so the
 * currency is derived from the attendee context (`event_attendee:` reference). Legacy
 * checkouts (`event_payment:` reference) still resolve from the pre-created payment row.
 */
async function resolveReturnCurrency(
  admin: SupabaseClient,
  externalReference: string,
): Promise<string> {
  const reference = parseEventGatewayReference(externalReference);
  if (!reference) return "";

  if (reference.kind === "attendee") {
    const context = await loadEventAttendeeGatewayContext(admin, reference.attendeeId);
    return context?.currency ?? "";
  }

  const { data: paymentRow } = await admin
    .from("event_payments")
    .select("currency")
    .eq("id", reference.paymentId)
    .maybeSingle();
  return String(paymentRow?.currency ?? "");
}

function mpReturnLooksFailed(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return normalized === "failure" || normalized === "rejected";
}

export async function reconcileEventMercadoPagoReturn(input: {
  mpPaymentId: string;
  externalReference: string;
  returnStatus: string;
}): Promise<EventPaymentReturnStatus> {
  if (mpReturnLooksFailed(input.returnStatus)) {
    return "failure";
  }

  const mpPaymentId = firstParam(input.mpPaymentId);
  if (!mpPaymentId) {
    return "processing";
  }

  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (e) {
    logServerException("reconcileEventMpReturn:encryptionKey", e);
    return "processing";
  }

  const admin = createAdminClient();
  const currency = await resolveReturnCurrency(admin, input.externalReference);
  const country = gatewayCountryForBillingCurrency(currency);

  if (!country) {
    logServerWarn("reconcileEventMpReturn:missing_country", {
      has_external_reference: Boolean(input.externalReference.trim()),
    });
    return "processing";
  }

  const creds = await loadMercadoPagoCredentialsPlain(admin, rawKey, country);
  if (!creds?.enabled) {
    return "processing";
  }

  const result = await finalizeEventPaymentFromMercadoPago({
    admin,
    accessToken: creds.accessToken,
    mpPaymentId,
  });

  if (!result.ok) {
    return "processing";
  }

  if (result.skipped === "mp_not_approved") {
    return "pending";
  }

  return result.paymentId ? "success" : "processing";
}

export async function reconcileEventFlowReturn(input: {
  token: string;
}): Promise<EventPaymentReturnStatus> {
  const token = firstParam(input.token);
  if (!token) {
    return "processing";
  }

  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (e) {
    logServerException("reconcileEventFlowReturn:encryptionKey", e);
    return "processing";
  }

  const admin = createAdminClient();
  const creds = await loadFlowChileCredentialsPlain(admin, rawKey);
  if (!creds?.enabled) {
    return "processing";
  }

  const result = await finalizeEventPaymentFromFlowGateway({
    admin,
    apiBaseUrl: flowChileApiBase(creds),
    apiKey: creds.apiKey,
    secretKey: creds.secretKey,
    token,
  });

  if (!result.ok) {
    return "processing";
  }

  if (result.skipped === "flow_not_paid") {
    return "pending";
  }

  return result.paymentId ? "success" : "processing";
}
