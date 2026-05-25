"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { startMercadoPagoMonthlyPaymentCore } from "@/lib/billing/startMercadoPagoMonthlyPaymentCore";
import { formatBillingPeriodLabel } from "@/lib/billing/formatBillingPeriodLabel";
import { composeFlowMonthlyOrderSubject } from "@/lib/billing/composeFlowMonthlyOrderSubject";
import { loadAcademicSectionDisplayNameForFlow } from "@/lib/billing/loadAcademicSectionDisplayNameForFlow";
import { truncateForFlowText } from "@/lib/billing/truncateFlowText";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { messageForMercadoPagoMonthlyCoreFailure } from "@/lib/payments/messageForMercadoPagoMonthlyCoreFailure";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Dictionary, Locale } from "@/types/i18n";

type PaymentPe = Dictionary["actionErrors"]["payment"];

export type RunMercadoPagoCheckoutInput = {
  supabase: SupabaseClient;
  pe: PaymentPe;
  locale: Locale;
  studentId: string;
  sectionId: string;
  month: number;
  year: number;
  amount: number;
  payerEmail: string;
  paymentsDashboard: "student" | "parent";
  tutorParentId: string | null;
  viewer: "student" | "tutor";
  actorUserId: string;
};

export async function runMercadoPagoMonthlyCheckout(
  input: RunMercadoPagoCheckoutInput,
): Promise<{ ok: true; redirectUrl: string } | { ok: false; message: string }> {
  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (e) {
    logServerException("runMercadoPagoMonthlyCheckout:encryption", e);
    return { ok: false, message: input.pe.uploadFailed };
  }

  const dict = await getDictionary(input.locale);
  const monthly = dict.dashboard.student.monthly;
  const sectionRaw = await loadAcademicSectionDisplayNameForFlow(input.supabase, input.sectionId);
  const sectionLabel = truncateForFlowText(
    sectionRaw ?? monthly.flowUnknownSection,
    120,
  );
  const periodLabel = formatBillingPeriodLabel(input.locale, input.year, input.month);
  const title = composeFlowMonthlyOrderSubject({
    template: monthly.flowOrderSubject,
    sectionName: sectionLabel,
    periodLabel,
  });

  const billing = await loadBillingCurrencySetting(input.supabase);
  const admin = createAdminClient();
  const core = await startMercadoPagoMonthlyPaymentCore({
    supabase: input.supabase,
    admin,
    encryptionKey32: rawKey,
    studentId: input.studentId,
    sectionId: input.sectionId,
    month: input.month,
    year: input.year,
    fallbackAmount: input.amount,
    payerEmail: input.payerEmail,
    locale: input.locale,
    title,
    paymentsDashboard: input.paymentsDashboard,
    tutorParentId: input.tutorParentId,
    billingCurrency: billing.currency,
  });

  if (!core.ok) {
    return {
      ok: false,
      message: messageForMercadoPagoMonthlyCoreFailure(input.pe, monthly, core),
    };
  }

  void recordUserEventServer({
    userId: input.actorUserId,
    eventType: "action",
    entity: AnalyticsEntity.monthlyPaymentMercadoPagoCheckoutStarted,
    metadata: {
      student_id: input.studentId,
      month: input.month,
      year: input.year,
      section_id: input.sectionId,
      viewer: input.viewer,
    },
  });

  return { ok: true, redirectUrl: core.redirectUrl };
}
