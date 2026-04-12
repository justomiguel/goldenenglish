"use server";

import { revalidatePath } from "next/cache";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { createClient } from "@/lib/supabase/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { sendPromotionAppliedEmail } from "@/lib/email/billingBenefitEmails";
import { paymentActionDict } from "@/lib/i18n/actionErrors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types/i18n";

const MAX_BYTES = 4 * 1024 * 1024;

function extFromMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export async function submitStudentPaymentReceipt(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const pe = await paymentActionDict(formData);
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  const file = formData.get("receipt");

  if (!Number.isFinite(month) || !Number.isFinite(year)) {
    return { ok: false, message: pe.invalidForm };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: pe.invalidAmount };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: pe.receiptRequired };
  }
  if (file.size > MAX_BYTES) return { ok: false, message: pe.fileTooLarge };

  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/") && mime !== "application/pdf") {
    return { ok: false, message: pe.mimeInvalid };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: pe.unauthorized };

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

  const { data: pay, error: payErr } = await supabase
    .from("payments")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (payErr || !pay) return { ok: false, message: pe.slotNotFound };
  if (pay.status !== "pending") {
    return { ok: false, message: pe.alreadyProcessed };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = extFromMime(mime);
  const path = `${user.id}/${pay.id}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("payment-receipts")
    .upload(path, buf, { contentType: mime, upsert: false });

  if (upErr) return { ok: false, message: pe.uploadFailed };

  const { error: upRow } = await supabase
    .from("payments")
    .update({
      receipt_url: path,
      amount,
    })
    .eq("id", pay.id)
    .eq("student_id", user.id)
    .eq("status", "pending");

  if (upRow) return { ok: false, message: pe.uploadFailed };

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.paymentReceiptSubmittedStudent,
    metadata: {
      month,
      year,
      receipt_kind: mime === "application/pdf" ? "pdf" : "image",
    },
  });
  return { ok: true };
}

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

  if (error) return { ok: false, message: pe.promoApplyFailed };

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
  } catch {
    /* optional */
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
