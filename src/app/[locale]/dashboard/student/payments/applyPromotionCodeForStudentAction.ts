"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { sendPromotionAppliedEmail } from "@/lib/email/billingBenefitEmails";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

type RpcResult = {
  ok?: boolean;
  message?: string;
  promotion_name?: string;
  code_snapshot?: string;
};

export async function applyPromotionCodeForStudent(
  locale: Locale,
  studentId: string,
  code: string,
): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(locale);
  const pe = dict.actionErrors.payment;
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, message: pe.emptyPromoCode };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: pe.unauthorized };

  if (user.id !== studentId) {
    const { data: link } = await supabase
      .from("tutor_student_rel")
      .select("student_id")
      .eq("tutor_id", user.id)
      .eq("student_id", studentId)
      .maybeSingle();
    if (!link) return { ok: false, message: pe.forbidden };
  } else {
    const perms = await getProfilePermissions(supabase, user.id);
    if (perms && !perms.canAccessPaymentsModule) {
      return { ok: false, message: pe.forbidden };
    }
  }

  const { data, error } = await supabase.rpc("apply_promotion_code", {
    p_student_id: studentId,
    p_code: trimmed,
  });

  if (error) {
    logSupabaseClientError("applyPromotionCodeForStudent:rpc", error, { studentId });
    return { ok: false, message: pe.promoApplyFailed };
  }

  const row = data as RpcResult | null;
  if (!row || row.ok !== true) {
    return {
      ok: false,
      message: typeof row?.message === "string" && row.message.trim() ? row.message : pe.promoApplyFailed,
    };
  }

  try {
    await sendPromotionAppliedEmail({
      studentId,
      locale,
      promotionName: row.promotion_name ?? "",
      codeSnapshot: row.code_snapshot ?? trimmed,
    });
  } catch (emailErr) {
    logServerException("applyPromotionCodeForStudent:sendPromotionAppliedEmail", emailErr, {
      studentId,
    });
  }

  revalidatePath(`/${locale}/dashboard/student/payments`);
  revalidatePath(`/${locale}/dashboard/parent/payments`);

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.promotionCodeAppliedStudent,
    metadata: {
      applied_by: user.id === studentId ? "student" : "parent",
    },
  });
  return { ok: true };
}
