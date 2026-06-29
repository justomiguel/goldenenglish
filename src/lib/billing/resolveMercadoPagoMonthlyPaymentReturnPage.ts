import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeMercadoPagoPayment } from "@/lib/billing/finalizeMercadoPagoPayment";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoGetPayment } from "@/lib/payment-gateways/mercadopago/mercadoPagoGetPayment";
import { parseMonthlyGatewayReference } from "@/lib/billing/parseMonthlyGatewayReference";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";

function parseCountry(raw: string | undefined): PaymentGatewayCountryCode | null {
  const c = raw?.trim().toUpperCase();
  if (c === "CL" || c === "AR") return c;
  return null;
}

export type MercadoPagoReturnPageModel =
  | { outcome: "no_reference" }
  | { outcome: "misconfigured" }
  | { outcome: "not_paid" }
  | { outcome: "unauthorized_payment" }
  | { outcome: "success"; month: number; year: number; paymentId: string }
  | { outcome: "processing" }
  | { outcome: "reconcile_error" };

export async function resolveMercadoPagoMonthlyPaymentReturnPage(input: {
  supabase: SupabaseClient;
  externalReference: string | undefined;
  mpPaymentId: string | undefined;
  returnStatus: string | undefined;
  countryCode: string | undefined;
  /** When false (default), skips DB finalize + cache revalidation — safe for RSC render. */
  allowFinalize?: boolean;
}): Promise<MercadoPagoReturnPageModel> {
  const allowFinalize = input.allowFinalize === true;
  const externalRef = input.externalReference?.trim() ?? "";
  const mpId = input.mpPaymentId?.trim() ?? "";
  if (!externalRef && !mpId) {
    return { outcome: "no_reference" };
  }

  const country = parseCountry(input.countryCode);
  if (!country) {
    return { outcome: "misconfigured" };
  }

  let rawKey: Buffer;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch {
    return { outcome: "misconfigured" };
  }

  const admin = createAdminClient();
  const creds = await loadMercadoPagoCredentialsPlain(admin, rawKey, country);
  if (!creds?.enabled) {
    return { outcome: "misconfigured" };
  }

  if (input.returnStatus === "failure") {
    return { outcome: "not_paid" };
  }

  if (!mpId) {
    return { outcome: "processing" };
  }

  const fetched = await mercadoPagoGetPayment({
    accessToken: creds.accessToken,
    paymentId: mpId,
  });
  if (!fetched.ok) {
    logServerWarn("resolveMercadoPagoReturnPage:getPayment", { err: fetched.error.slice(0, 80) });
    return { outcome: "reconcile_error" };
  }

  if (fetched.data.status !== "approved") {
    if (fetched.data.status === "pending" || fetched.data.status === "in_process") {
      return { outcome: "processing" };
    }
    return { outcome: "not_paid" };
  }

  const refRaw = externalRef || fetched.data.external_reference?.trim() || "";
  const ref = parseMonthlyGatewayReference(refRaw);

  // Legacy `payments.id` references: enforce RLS visibility on the existing row
  // before finalizing so a user only ever sees their own payment.
  if (ref?.kind === "payment") {
    const { data: visible } = await input.supabase
      .from("payments")
      .select("id, month, year, status")
      .eq("id", ref.paymentId)
      .maybeSingle();
    if (!visible) {
      return { outcome: "unauthorized_payment" };
    }
    if (visible.status === "approved") {
      return {
        outcome: "success",
        month: Number(visible.month),
        year: Number(visible.year),
        paymentId: visible.id as string,
      };
    }
  }

  // Deferred-creation (`tuition:` slot) references have no row yet, so we cannot
  // pre-check RLS here. The row is materialized via the admin client below and
  // ownership is enforced by re-reading it through the user-scoped client.
  if (!allowFinalize) {
    return { outcome: "processing" };
  }

  const finalized = await finalizeMercadoPagoPayment({
    admin,
    accessToken: creds.accessToken,
    mpPaymentId: mpId,
    mpPaidSnapshot: fetched.data,
  });

  if (!finalized.ok) {
    return { outcome: "reconcile_error" };
  }

  if (finalized.approved && finalized.paymentId) {
    const { data: row } = await input.supabase
      .from("payments")
      .select("month, year")
      .eq("id", finalized.paymentId)
      .maybeSingle();
    if (row) {
      return {
        outcome: "success",
        month: Number(row.month),
        year: Number(row.year),
        paymentId: finalized.paymentId,
      };
    }
  }

  return { outcome: "processing" };
}
