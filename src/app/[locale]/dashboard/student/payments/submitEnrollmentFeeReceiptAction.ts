"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { createClient } from "@/lib/supabase/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { paymentActionDict } from "@/lib/i18n/actionErrors";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { extFromMime, MAX_PAYMENT_RECEIPT_BYTES } from "./paymentReceiptShared";

export async function submitEnrollmentFeeReceipt(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const pe = await paymentActionDict(formData);
  const sectionIdRaw = formData.get("sectionId");
  const file = formData.get("receipt");

  const sectionIdParsed = z.string().uuid().safeParse(sectionIdRaw);
  if (!sectionIdParsed.success) return { ok: false, message: pe.invalidForm };

  if (!(file instanceof File) || file.size === 0) return { ok: false, message: pe.receiptRequired };
  if (file.size > MAX_PAYMENT_RECEIPT_BYTES) return { ok: false, message: pe.fileTooLarge };

  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/") && mime !== "application/pdf") {
    return { ok: false, message: pe.mimeInvalid };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: pe.unauthorized };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") return { ok: false, message: pe.forbidden };

  const perms = await getProfilePermissions(supabase, user.id);
  if (perms && !perms.canAccessPaymentsModule) return { ok: false, message: pe.forbidden };

  const { data: enrollment } = await supabase
    .from("section_enrollments")
    .select("id, enrollment_fee_exempt, enrollment_fee_receipt_status")
    .eq("student_id", user.id)
    .eq("section_id", sectionIdParsed.data)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) return { ok: false, message: pe.enrollmentNotFound };
  if (enrollment.enrollment_fee_exempt) return { ok: false, message: pe.enrollmentFeeExempt };
  if (enrollment.enrollment_fee_receipt_status === "approved") {
    return { ok: false, message: pe.enrollmentAlreadyApproved };
  }

  const ext = extFromMime(mime);
  const path = `${user.id}/enrollment-fee/${enrollment.id}-${Date.now()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from("payment-receipts")
    .upload(path, buf, { contentType: mime, upsert: false });
  if (upErr) {
    logSupabaseClientError("submitEnrollmentFeeReceipt:upload", upErr, { studentId: user.id });
    return { ok: false, message: pe.uploadFailed };
  }

  const { error: updErr } = await supabase
    .from("section_enrollments")
    .update({
      enrollment_fee_receipt_url: path,
      enrollment_fee_receipt_status: "pending",
      enrollment_fee_receipt_uploaded_at: new Date().toISOString(),
    })
    .eq("id", enrollment.id)
    .eq("student_id", user.id);

  if (updErr) {
    logSupabaseClientError("submitEnrollmentFeeReceipt:update", updErr, { studentId: user.id });
    return { ok: false, message: pe.uploadFailed };
  }

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.enrollmentFeeReceiptSubmittedStudent,
    metadata: { section_id: sectionIdParsed.data, receipt_kind: mime === "application/pdf" ? "pdf" : "image" },
  });

  revalidatePath(`/dashboard/student/payments`, "page");
  return { ok: true };
}
