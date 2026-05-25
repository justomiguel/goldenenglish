import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveStudentPaymentSlot,
  type StudentPaymentSlotFailureReason,
} from "@/lib/billing/resolveStudentPaymentSlot";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
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

  const slot = await resolveStudentPaymentSlot(input.supabase, {
    studentId: input.studentId,
    sectionId: input.sectionId,
    month: input.month,
    year: input.year,
    fallbackAmount: input.fallbackAmount,
    actingParentIdForInsert: input.tutorParentId ?? null,
  });

  if (!slot.ok) {
    return { ok: false, code: "slot", slotReason: slot.reason };
  }

  const paymentId = slot.payment.id;
  const effective = slot.effectiveAmount;

  if (input.tutorParentId) {
    await input.supabase
      .from("payments")
      .update({ parent_id: input.tutorParentId })
      .eq("id", paymentId)
      .eq("student_id", input.studentId)
      .in("status", ["pending", "rejected"]);
  }

  const creds = await loadMercadoPagoCredentialsPlain(
    input.admin,
    input.encryptionKey32,
    country as PaymentGatewayCountryCode,
  );
  if (!creds?.enabled) {
    return { ok: false, code: "no_credentials" };
  }

  const plan = await resolveSectionPlanMonthlyAmount(
    input.supabase,
    input.studentId,
    input.sectionId,
    input.year,
    input.month,
  );
  if (plan.code !== "ok") {
    return { ok: false, code: "slot" };
  }

  const cur = plan.currency.trim().toUpperCase();
  const billingCur = input.billingCurrency.trim().toUpperCase();
  if (cur !== billingCur || (cur !== "CLP" && cur !== "ARS")) {
    return { ok: false, code: "currency_unsupported" };
  }

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
    externalReference: paymentId,
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
      payment_id: paymentId,
      month: input.month,
      year: input.year,
      section_id: input.sectionId,
    });
    return { ok: false, code: "mp_error" };
  }

  const { error: prefErr } = await input.admin
    .from("payments")
    .update({ mp_preference_id: created.preferenceId })
    .eq("id", paymentId);

  if (prefErr) {
    logServerActionInvariantViolation(
      "startMercadoPagoMonthlyPaymentCore:storePreference",
      prefErr.message,
      { payment_id: paymentId },
    );
  }

  return { ok: true, redirectUrl: created.redirectUrl };
}
