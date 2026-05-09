"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { paymentActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { resolveTutorStudentLink } from "@/lib/auth/resolveTutorStudentLink";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { startFlowMonthlyPaymentCore } from "@/lib/billing/startFlowMonthlyPaymentCore";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

export type StartFlowMonthlyPaymentActionResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; message: string };

export async function startTutorFlowMonthlyPayment(
  formData: FormData,
): Promise<StartFlowMonthlyPaymentActionResult> {
  const pe = await paymentActionDict(formData);
  const localeRaw = localeFromFormData(formData);
  const studentId = String(formData.get("studentId") ?? "").trim();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  const sectionId = String(formData.get("sectionId") ?? "").trim();

  if (!studentId || !Number.isFinite(month) || !Number.isFinite(year) || !sectionId) {
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
  if (profile?.role !== "parent") return { ok: false, message: pe.forbidden };

  const link = await resolveTutorStudentLink(supabase, user.id, studentId);
  if (!link.linked) return { ok: false, message: pe.studentNotLinked };
  if (!link.financialAccessActive) return { ok: false, message: pe.forbidden };

  let rawKey;
  try {
    rawKey = loadPaymentGatewayEncryptionKeyRaw32();
  } catch (e) {
    logServerException("startTutorFlowMonthlyPayment:encryption", e);
    return { ok: false, message: pe.uploadFailed };
  }

  const dict = await getDictionary(localeRaw);
  const subject = dict.dashboard.student.monthly.flowOrderSubject
    .replace("{month}", String(month))
    .replace("{year}", String(year));

  const admin = createAdminClient();
  const core = await startFlowMonthlyPaymentCore({
    supabase,
    admin,
    encryptionKey32: rawKey,
    studentId,
    sectionId,
    month,
    year,
    fallbackAmount: amount,
    payerEmail: user.email,
    locale: localeRaw,
    subject,
    paymentsDashboard: "parent",
    tutorParentId: user.id,
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
    return { ok: false, message: pe.slotNotFound };
  }

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.monthlyPaymentFlowCheckoutStarted,
    metadata: {
      student_id: studentId,
      month,
      year,
      section_id: sectionId,
      viewer: "tutor",
    },
  });

  return { ok: true, redirectUrl: core.redirectUrl };
}
