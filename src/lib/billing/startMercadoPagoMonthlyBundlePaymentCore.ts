import type { SupabaseClient } from "@supabase/supabase-js";
import type { Buffer } from "node:buffer";
import { validateStudentSectionMonthlySlot } from "@/lib/billing/validateStudentSectionMonthlySlot";
import { insertMonthlyCheckoutBundle } from "@/lib/billing/insertMonthlyCheckoutBundle";
import { buildTuitionBundleGatewayReference } from "@/lib/billing/parseMonthlyGatewayReference";
import { loadMercadoPagoCredentialsPlain } from "@/lib/payment-gateways/mercadopago/loadMercadoPagoCredentialsPlain";
import { mercadoPagoCreatePreference } from "@/lib/payment-gateways/mercadopago/mercadoPagoCreatePreference";
import { gatewayCountryForBillingCurrency } from "@/lib/payment-gateways/gatewayCountryForBillingCurrency";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { logServerActionInvariantViolation } from "@/lib/logging/serverActionLog";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";
import type { StartMercadoPagoMonthlyPaymentCoreResult } from "@/lib/billing/startMercadoPagoMonthlyPaymentCore";

export async function startMercadoPagoMonthlyBundlePaymentCore(input: {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  encryptionKey32: Buffer;
  studentId: string;
  sectionIds: string[];
  month: number;
  year: number;
  expectedTotal: number;
  payerEmail: string;
  locale: string;
  title: string;
  paymentsDashboard: "student" | "parent";
  tutorParentId: string | null;
  billingCurrency: string;
}): Promise<StartMercadoPagoMonthlyPaymentCoreResult> {
  const country = gatewayCountryForBillingCurrency(input.billingCurrency);
  if (!country) return { ok: false, code: "no_country" };

  let sum = 0;
  let currency = "";
  for (const sectionId of input.sectionIds) {
    const validation = await validateStudentSectionMonthlySlot(input.supabase, {
      studentId: input.studentId,
      sectionId,
      month: input.month,
      year: input.year,
    });
    if (!validation.ok) return { ok: false, code: "slot", slotReason: validation.reason };
    sum += validation.effectiveAmount;
    currency = validation.currency.trim().toUpperCase();
  }

  const billingCur = input.billingCurrency.trim().toUpperCase();
  if (currency !== billingCur || (currency !== "CLP" && currency !== "ARS")) {
    return { ok: false, code: "currency_unsupported" };
  }

  const creds = await loadMercadoPagoCredentialsPlain(
    input.admin,
    input.encryptionKey32,
    country as PaymentGatewayCountryCode,
  );
  if (!creds?.enabled) return { ok: false, code: "no_credentials" };

  const origin = getPublicSiteUrl();
  if (!origin) return { ok: false, code: "no_public_url" };

  const inserted = await insertMonthlyCheckoutBundle(input.admin, {
    studentId: input.studentId,
    parentId: input.tutorParentId,
    year: input.year,
    month: input.month,
    currency,
    expectedTotal: input.expectedTotal,
    sectionIds: input.sectionIds,
  });
  if (!inserted.ok) return { ok: false, code: "mp_error" };

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
    unitPrice: Math.round(sum),
    currencyId: currency,
    externalReference: buildTuitionBundleGatewayReference(inserted.bundleId),
    payerEmail: input.payerEmail,
    notificationUrl: notificationUrl.toString(),
    backUrls: {
      success: `${returnBase}&status=success`,
      failure: `${returnBase}&status=failure`,
      pending: `${returnBase}&status=pending`,
    },
  });

  if (!created.ok) {
    logServerActionInvariantViolation("startMercadoPagoMonthlyBundlePaymentCore:create", created.error, {
      bundle_id: inserted.bundleId,
    });
    return { ok: false, code: "mp_error" };
  }

  return { ok: true, redirectUrl: created.redirectUrl };
}
