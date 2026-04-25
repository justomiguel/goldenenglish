"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { createClient } from "@/lib/supabase/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { paymentActionDict } from "@/lib/i18n/actionErrors";
import { resolveStudentPaymentSlot } from "@/lib/billing/resolveStudentPaymentSlot";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { extFromMime, MAX_PAYMENT_RECEIPT_BYTES } from "./paymentReceiptShared";

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
  if (file.size > MAX_PAYMENT_RECEIPT_BYTES) return { ok: false, message: pe.fileTooLarge };

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

  const sectionIdRaw = formData.get("sectionId");
  const sectionId =
    typeof sectionIdRaw === "string" && sectionIdRaw.trim().length > 0
      ? sectionIdRaw.trim()
      : null;

  const slot = await resolveStudentPaymentSlot(supabase, {
    studentId: user.id,
    sectionId,
    month,
    year,
    fallbackAmount: amount,
  });
  if (!slot.ok) {
    if (slot.reason === "forbidden") return { ok: false, message: pe.forbidden };
    if (slot.reason === "already_processed") return { ok: false, message: pe.alreadyProcessed };
    if (slot.reason === "upload_failed") return { ok: false, message: pe.uploadFailed };
    return { ok: false, message: pe.slotNotFound };
  }
  const pay = slot.payment;
  const effectiveAmount = slot.effectiveAmount;

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
      amount: effectiveAmount,
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
      ...(sectionId ? { section_id: sectionId } : {}),
    },
  });
  return { ok: true };
}
