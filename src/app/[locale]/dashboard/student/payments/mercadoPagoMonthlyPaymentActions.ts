"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { paymentActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { runMercadoPagoMonthlyCheckout } from "@/lib/payments/runMercadoPagoMonthlyCheckout";
import type { Locale } from "@/types/i18n";

export type StartMercadoPagoMonthlyPaymentActionResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; message: string };

export async function startStudentMercadoPagoMonthlyPayment(
  formData: FormData,
): Promise<StartMercadoPagoMonthlyPaymentActionResult> {
  const pe = await paymentActionDict(formData);
  const localeRaw = localeFromFormData(formData) as Locale;
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

  return runMercadoPagoMonthlyCheckout({
    supabase,
    pe,
    locale: localeRaw,
    studentId: user.id,
    sectionId,
    month,
    year,
    amount,
    payerEmail: user.email,
    paymentsDashboard: "student",
    tutorParentId: null,
    viewer: "student",
    actorUserId: user.id,
  });
}
