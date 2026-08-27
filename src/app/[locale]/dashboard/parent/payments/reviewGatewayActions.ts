"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { resolveTutorStudentLink } from "@/lib/auth/resolveTutorStudentLink";
import {
  loadParentMonthlyReviewCharge,
  parseParentMonthlyReviewForm,
} from "@/lib/billing/loadParentMonthlyReviewCharge";
import { startTutorFlowMonthlyPayment } from "@/app/[locale]/dashboard/parent/payments/flowMonthlyPaymentActions";
import { startTutorMercadoPagoMonthlyPayment } from "@/app/[locale]/dashboard/parent/payments/mercadoPagoMonthlyPaymentActions";
import { startFlowMonthlyBundlePaymentCore } from "@/lib/billing/startFlowMonthlyBundlePaymentCore";
import { startMercadoPagoMonthlyBundlePaymentCore } from "@/lib/billing/startMercadoPagoMonthlyBundlePaymentCore";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatBillingPeriodLabel } from "@/lib/billing/formatBillingPeriodLabel";
import { composeFlowMonthlyOrderSubject } from "@/lib/billing/composeFlowMonthlyOrderSubject";
import { loadStudentDisplayNameForFlow } from "@/lib/billing/loadStudentDisplayNameForFlow";
import { truncateForFlowText } from "@/lib/billing/truncateFlowText";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { messageForFlowMonthlySlotFailure } from "@/lib/payments/messageForFlowMonthlySlotFailure";
import { messageForMercadoPagoMonthlyCoreFailure } from "@/lib/payments/messageForMercadoPagoMonthlyCoreFailure";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

async function authorizeReviewCheckout(formData: FormData) {
  const pe = await paymentActionDict(formData);
  const localeRaw = localeFromFormData(formData) as Locale;
  const parsed = parseParentMonthlyReviewForm(formData);
  if (!parsed) return { ok: false as const, message: pe.invalidForm };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false as const, message: pe.unauthorized };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "parent") return { ok: false as const, message: pe.forbidden };

  const link = await resolveTutorStudentLink(supabase, user.id, parsed.studentId);
  if (!link.linked) return { ok: false as const, message: pe.studentNotLinked };
  if (!link.financialAccessActive) return { ok: false as const, message: pe.forbidden };

  const charge = await loadParentMonthlyReviewCharge(supabase, parsed);
  if (!charge.ok) {
    return { ok: false as const, message: charge.reason === "stale" ? pe.staleSnapshot : pe.invalidForm };
  }

  return { ok: true as const, pe, localeRaw, parsed, supabase, user, charge };
}

export async function startTutorFlowMonthlyReviewPayment(formData: FormData) {
  const auth = await authorizeReviewCheckout(formData);
  if (!auth.ok) return { ok: false as const, message: auth.message };
  if (auth.charge.lines.length === 1) {
    const line = auth.charge.lines[0]!;
    formData.set("sectionId", line.sectionId);
    formData.set("amount", String(line.amount));
    return startTutorFlowMonthlyPayment(formData);
  }

  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (e) {
    logServerException("startTutorFlowMonthlyReviewPayment:encryption", e);
    return { ok: false as const, message: auth.pe.uploadFailed };
  }

  const dict = await getDictionary(auth.localeRaw);
  const monthly = dict.dashboard.student.monthly;
  const studentFlowLabel = truncateForFlowText(
    await loadStudentDisplayNameForFlow(auth.supabase, auth.charge.studentId, monthly.flowUnknownStudent),
    120,
  );
  const periodLabel = formatBillingPeriodLabel(auth.localeRaw, auth.charge.year, auth.charge.month);
  const sectionFlowLabel = truncateForFlowText(
    `${auth.charge.lines.length} ${monthly.flowUnknownSection}`,
    120,
  );
  const subject = composeFlowMonthlyOrderSubject({
    template: monthly.flowOrderSubject,
    sectionName: sectionFlowLabel,
    periodLabel,
  });

  const core = await startFlowMonthlyBundlePaymentCore({
    supabase: auth.supabase,
    admin: createAdminClient(),
    encryptionKey32: rawKey,
    studentId: auth.charge.studentId,
    sectionIds: auth.charge.lines.map((l) => l.sectionId),
    month: auth.charge.month,
    year: auth.charge.year,
    expectedTotal: auth.charge.total,
    currency: auth.charge.currency,
    payerEmail: auth.user.email!,
    locale: auth.localeRaw,
    subject,
    paymentsDashboard: "parent",
    tutorParentId: auth.user.id,
    studentLabelForFlow: studentFlowLabel,
    sectionLabelForFlow: sectionFlowLabel,
    periodLabelForFlow: periodLabel,
  });

  if (!core.ok) {
    if (core.code === "slot") {
      return { ok: false as const, message: messageForFlowMonthlySlotFailure(auth.pe, core.slotReason) };
    }
    if (core.code === "clp_only") return { ok: false as const, message: monthly.flowErrorClpOnly };
    if (core.code === "no_public_url") return { ok: false as const, message: monthly.flowErrorNoPublicUrl };
    if (core.code === "no_credentials") return { ok: false as const, message: monthly.flowErrorUnavailable };
    if (core.code === "flow_amount_below_minimum") {
      return {
        ok: false as const,
        message: monthly.flowErrorBelowMinimumClp.replace("{minAmount}", String(core.flowMinClp ?? 350)),
      };
    }
    return { ok: false as const, message: monthly.flowErrorProvider };
  }
  return { ok: true as const, redirectUrl: core.redirectUrl };
}

export async function startTutorMercadoPagoMonthlyReviewPayment(formData: FormData) {
  const auth = await authorizeReviewCheckout(formData);
  if (!auth.ok) return { ok: false as const, message: auth.message };
  if (auth.charge.lines.length === 1) {
    const line = auth.charge.lines[0]!;
    formData.set("sectionId", line.sectionId);
    formData.set("amount", String(line.amount));
    return startTutorMercadoPagoMonthlyPayment(formData);
  }

  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (e) {
    logServerException("startTutorMercadoPagoMonthlyReviewPayment:encryption", e);
    return { ok: false as const, message: auth.pe.uploadFailed };
  }

  const dict = await getDictionary(auth.localeRaw);
  const monthly = dict.dashboard.student.monthly;
  const billing = await loadBillingCurrencySetting(auth.supabase);
  const periodLabel = formatBillingPeriodLabel(auth.localeRaw, auth.charge.year, auth.charge.month);
  const title = composeFlowMonthlyOrderSubject({
    template: monthly.flowOrderSubject,
    sectionName: String(auth.charge.lines.length),
    periodLabel,
  });

  const core = await startMercadoPagoMonthlyBundlePaymentCore({
    supabase: auth.supabase,
    admin: createAdminClient(),
    encryptionKey32: rawKey,
    studentId: auth.charge.studentId,
    sectionIds: auth.charge.lines.map((l) => l.sectionId),
    month: auth.charge.month,
    year: auth.charge.year,
    expectedTotal: auth.charge.total,
    payerEmail: auth.user.email!,
    locale: auth.localeRaw,
    title,
    paymentsDashboard: "parent",
    tutorParentId: auth.user.id,
    billingCurrency: billing.currency,
  });

  if (!core.ok) {
    return {
      ok: false as const,
      message: messageForMercadoPagoMonthlyCoreFailure(auth.pe, monthly, core),
    };
  }
  return { ok: true as const, redirectUrl: core.redirectUrl };
}
