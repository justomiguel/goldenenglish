import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentPaymentSlotFailureReason } from "@/lib/billing/resolveStudentPaymentSlot";
import { validateStudentSectionMonthlySlot } from "@/lib/billing/validateStudentSectionMonthlySlot";
import { buildTuitionGatewayReference } from "@/lib/billing/parseMonthlyGatewayReference";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoCreatePreference } from "@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference";
import { gatewayCountryForBillingCurrency } from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerActionInvariantViolation } from "@/lib/logging/serverActionLog";
import type { Buffer } from "node:buffer";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";

export type StartMercadoPagoMonthlyPaymentCoreResult =
  | { ok: true; redirectUrl: string }
  | {
      ok: false;
      code:
        | "slot"
        | "no_credentials"
        | "currency_unsupported"
        | "no_public_url"
        | "mp_error"
        | "no_country";
      slotReason?: StudentPaymentSlotFailureReason;
    };

export async function startMercadoPagoMonthlyPaymentCore(input: {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  studentId: string;
  sectionId: string;
  month: number;
  year: number;
  fallbackAmount: number;
  payerEmail: string;
  locale: string;
  title: string;
  paymentsDashboard: "student" | "parent";
  tutorParentId: string | null;
  /** Billing currency from tenant settings (CLP, ARS, …). */
  billingCurrency: string;
}): Promise<StartMercadoPagoMonthlyPaymentCoreResult> {
  const country = gatewayCountryForBillingCurrency(input.billingCurrency);
  if (!country) {
    return { ok: false, code: "no_country" };
  }

  // Deferred creation: validate the billing slot only. No `payments` row is
  // created here — the row is materialized as `approved` on gateway confirmation.
  const validation = await validateStudentSectionMonthlySlot(input.supabase, {
    studentId: input.studentId,
    sectionId: input.sectionId,
    month: input.month,
    year: input.year,
  });

  if (!validation.ok) {
    return { ok: false, code: "slot", slotReason: validation.reason };
  }

  const effective = validation.effectiveAmount;

  const creds = await loadMercadoPagoCredentialsPlain(
    input.admin,
    input.encryptionKey32,
    country as PaymentGatewayCountryCode,
  );
  if (!creds?.enabled) {
    return { ok: false, code: "no_credentials" };
  }

  const cur = validation.currency.trim().toUpperCase();
  const billingCur = input.billingCurrency.trim().toUpperCase();
  if (cur !== billingCur || (cur !== "CLP" && cur !== "ARS")) {
    return { ok: false, code: "currency_unsupported" };
  }

  const externalReference = buildTuitionGatewayReference({
    studentId: input.studentId,
    sectionId: input.sectionId,
    year: input.year,
    month: input.month,
    parentId: input.tutorParentId ?? null,
  });

  const unitPrice = Math.round(effective);
  const origin = getPublicSiteUrl();
  if (!origin) {
    return { ok: false, code: "no_public_url" };
  }

  const notificationUrl = new URL("/api/payments/mercadopago/webhook", origin);
  notificationUrl.searchParams.set("country", country);

  const returnBridge = new URL("/api/payments/mercadopago/return-bridge", origin);
  returnBridge.searchParams.set("locale", input.locale);
  returnBridge.searchParams.set("dashboard", input.paymentsDashboard);
  returnBridge.searchParams.set("country", country);
  const returnBase = returnBridge.toString();

  const created = await mercadoPagoCreatePreference({
    accessToken: creds.accessToken,
    environment: creds.environment,
    title: input.title,
    unitPrice,
    currencyId: cur,
    externalReference,
    payerEmail: input.payerEmail,
    notificationUrl: notificationUrl.toString(),
    backUrls: {
      success: `${returnBase}&status=success`,
      failure: `${returnBase}&status=failure`,
      pending: `${returnBase}&status=pending`,
    },
  });

  if (!created.ok) {
    logServerActionInvariantViolation("startMercadoPagoMonthlyPaymentCore:createPreference", created.error, {
      external_reference: externalReference,
      month: input.month,
      year: input.year,
      section_id: input.sectionId,
    });
    return { ok: false, code: "mp_error" };
  }

  // No `payments` row exists yet (deferred creation), so the MP preference id is
  // not persisted at start; finalize stores it via upsertMpFinalizeRecord.
  return { ok: true, redirectUrl: created.redirectUrl };
}
