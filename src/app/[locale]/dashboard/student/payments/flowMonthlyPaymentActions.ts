"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { paymentActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { startFlowMonthlyPaymentCore } from "@/lib/billing/startFlowMonthlyPaymentCore";
import { formatBillingPeriodLabel } from "@/lib/billing/formatBillingPeriodLabel";
import { composeFlowMonthlyOrderSubject } from "@/lib/billing/composeFlowMonthlyOrderSubject";
import { loadAcademicSectionDisplayNameForFlow } from "@/lib/billing/loadAcademicSectionDisplayNameForFlow";
import { loadStudentDisplayNameForFlow } from "@/lib/billing/loadStudentDisplayNameForFlow";
import { truncateForFlowText } from "@/lib/billing/truncateFlowText";
import { messageForFlowMonthlySlotFailure } from "@/lib/payments/messageForFlowMonthlySlotFailure";
import { logServerException } from "@/lib/logging/serverActionLog";

export type StartFlowMonthlyPaymentActionResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; message: string };

export async function startStudentFlowMonthlyPayment(
  formData: FormData,
): Promise<StartFlowMonthlyPaymentActionResult> {
  const pe = await paymentActionDict(formData);
  const localeRaw = localeFromFormData(formData);
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  const sectionId = String(formData.get("sectionId") ?? "").trim();

  if (!Number.isFinite(month) || !Number.isFinite(year) || !sectionId) {
    return { ok: false, message: pe.invalidForm };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: pe.invalidAmount };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: pe.unauthorized };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") return { ok: false, message: pe.forbidden };

  const perms = await getProfilePermissions(supabase, user.id);
  if (perms && !perms.canAccessPaymentsModule) {
    return { ok: false, message: pe.forbidden };
  }

  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (e) {
    logServerException("startStudentFlowMonthlyPayment:encryption", e);
    return { ok: false, message: pe.uploadFailed };
  }

  const dict = await getDictionary(localeRaw);
  const sectionRaw = await loadAcademicSectionDisplayNameForFlow(supabase, sectionId);
  const sectionFlowLabel = truncateForFlowText(
    sectionRaw ?? dict.dashboard.student.monthly.flowUnknownSection,
    120,
  );
  const studentFlowLabel = truncateForFlowText(
    await loadStudentDisplayNameForFlow(supabase, user.id, dict.dashboard.student.monthly.flowUnknownStudent),
    120,
  );
  const periodLabel = formatBillingPeriodLabel(localeRaw, year, month);
  const subject = composeFlowMonthlyOrderSubject({
    template: dict.dashboard.student.monthly.flowOrderSubject,
    sectionName: sectionFlowLabel,
    periodLabel,
  });

  const admin = createAdminClient();
  const core = await startFlowMonthlyPaymentCore({
    supabase,
    admin,
    encryptionKey32: rawKey,
    studentId: user.id,
    sectionId,
    month,
    year,
    fallbackAmount: amount,
    payerEmail: user.email,
    locale: localeRaw,
    subject,
    paymentsDashboard: "student",
    tutorParentId: null,
    studentLabelForFlow: studentFlowLabel,
    sectionLabelForFlow: sectionFlowLabel,
    periodLabelForFlow: periodLabel,
  });

  if (!core.ok) {
    if (core.code === "clp_only") {
      return { ok: false, message: dict.dashboard.student.monthly.flowErrorClpOnly };
    }
    if (core.code === "no_public_url") {
      return { ok: false, message: dict.dashboard.student.monthly.flowErrorNoPublicUrl };
    }
    if (core.code === "no_credentials") {
      return { ok: false, message: dict.dashboard.student.monthly.flowErrorUnavailable };
    }
    if (core.code === "flow_error") {
      return { ok: false, message: dict.dashboard.student.monthly.flowErrorProvider };
    }
    if (core.code === "slot") {
      return {
        ok: false,
        message: messageForFlowMonthlySlotFailure(pe, core.slotReason),
      };
    }
    return { ok: false, message: pe.slotNotFound };
  }

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.monthlyPaymentFlowCheckoutStarted,
    metadata: {
      student_id: user.id,
      month,
      year,
      section_id: sectionId,
      viewer: "student",
    },
  });

  return { ok: true, redirectUrl: core.redirectUrl };
}
