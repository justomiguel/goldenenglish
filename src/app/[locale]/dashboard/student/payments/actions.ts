"use server";

import { revalidatePath } from "next/cache";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { createClient } from "@/lib/supabase/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { sendPromotionAppliedEmail } from "@/lib/email/billingBenefitEmails";
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
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  const file = formData.get("receipt");

  if (!Number.isFinite(month) || !Number.isFinite(year)) {
    return { ok: false, message: "Invalid form" };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Invalid amount" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Receipt file required" };
  }
  if (file.size > MAX_BYTES) return { ok: false, message: "File too large" };

  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/") && mime !== "application/pdf") {
    return { ok: false, message: "Use PDF or image" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") return { ok: false, message: "Forbidden" };

  const perms = await getProfilePermissions(supabase, user.id);
  if (perms && !perms.canAccessPaymentsModule) {
    return { ok: false, message: "Forbidden" };
  }

  const { data: pay, error: payErr } = await supabase
    .from("payments")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (payErr || !pay) return { ok: false, message: "Payment slot not found" };
  if (pay.status !== "pending") {
    return { ok: false, message: "Payment already processed" };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = extFromMime(mime);
  const path = `${user.id}/${pay.id}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("payment-receipts")
    .upload(path, buf, { contentType: mime, upsert: false });

  if (upErr) return { ok: false, message: upErr.message };

  const { error: upRow } = await supabase
    .from("payments")
    .update({
      receipt_url: path,
      amount,
    })
    .eq("id", pay.id)
    .eq("student_id", user.id)
    .eq("status", "pending");

  if (upRow) return { ok: false, message: upRow.message };

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
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, message: "Empty code" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  if (user.id !== studentId) {
    const { data: link } = await supabase
      .from("tutor_student_rel")
      .select("student_id")
      .eq("tutor_id", user.id)
      .eq("student_id", studentId)
      .maybeSingle();
    if (!link) return { ok: false, message: "Forbidden" };
  } else {
    const perms = await getProfilePermissions(supabase, user.id);
    if (perms && !perms.canAccessPaymentsModule) {
      return { ok: false, message: "Forbidden" };
    }
  }

  const { data, error } = await supabase.rpc("apply_promotion_code", {
    p_student_id: studentId,
    p_code: trimmed,
  });

  if (error) return { ok: false, message: error.message };

  const row = data as RpcResult | null;
  if (!row || row.ok !== true) {
    return { ok: false, message: typeof row?.message === "string" ? row.message : "Error" };
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
