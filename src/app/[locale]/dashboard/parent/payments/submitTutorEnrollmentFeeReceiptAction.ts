"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { createClient } from "@/lib/supabase/server";
import { paymentActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { resolveTutorStudentLink } from "@/lib/auth/resolveTutorStudentLink";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const MAX_BYTES = 4 * 1024 * 1024;

function extFromMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

/**
 * Tutor (parent) uploads an enrollment fee receipt on behalf of a linked
 * student. Mirrors `submitEnrollmentFeeReceipt` for the student role.
 */
export async function submitTutorEnrollmentFeeReceipt(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const pe = await paymentActionDict(formData);
  const locale = localeFromFormData(formData);
  const studentId = String(formData.get("studentId") ?? "").trim();
  const sectionIdRaw = formData.get("sectionId");
  const file = formData.get("receipt");

  const sectionIdParsed = z.string().uuid().safeParse(sectionIdRaw);
  if (!studentId || !sectionIdParsed.success) return { ok: false, message: pe.invalidForm };

  if (!(file instanceof File) || file.size === 0) return { ok: false, message: pe.receiptRequired };
  if (file.size > MAX_BYTES) return { ok: false, message: pe.fileTooLarge };

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
  if (profile?.role !== "parent") return { ok: false, message: pe.forbidden };

  const link = await resolveTutorStudentLink(supabase, user.id, studentId);
  if (!link.linked) return { ok: false, message: pe.studentNotLinked };
  if (!link.financialAccessActive) return { ok: false, message: pe.forbidden };

  const { data: enrollment } = await supabase
    .from("section_enrollments")
    .select("id, enrollment_fee_exempt, enrollment_fee_receipt_status")
    .eq("student_id", studentId)
    .eq("section_id", sectionIdParsed.data)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) return { ok: false, message: pe.enrollmentNotFound };
  if (enrollment.enrollment_fee_exempt) return { ok: false, message: pe.enrollmentFeeExempt };
  if (enrollment.enrollment_fee_receipt_status === "approved") {
    return { ok: false, message: pe.enrollmentAlreadyApproved };
  }

  const ext = extFromMime(mime);
  const path = `${studentId}/enrollment-fee/${enrollment.id}-${Date.now()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from("payment-receipts")
    .upload(path, buf, { contentType: mime, upsert: false });
  if (upErr) {
    logSupabaseClientError("submitTutorEnrollmentFeeReceipt:upload", upErr, { studentId });
    return { ok: false, message: pe.uploadFailed };
  }

  const { error: updErr } = await supabase.rpc("submit_enrollment_fee_receipt", {
    p_student_id: studentId,
    p_enrollment_id: enrollment.id,
    p_section_id: sectionIdParsed.data,
    p_receipt_url: path,
  });

  if (updErr) {
    logSupabaseClientError("submitTutorEnrollmentFeeReceipt:update", updErr, { studentId });
    return { ok: false, message: pe.uploadFailed };
  }

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.enrollmentFeeReceiptSubmittedTutor,
    metadata: {
      student_id: studentId,
      section_id: sectionIdParsed.data,
      receipt_kind: mime === "application/pdf" ? "pdf" : "image",
    },
  });

  revalidatePath(`/${locale}/dashboard/parent/payments`);
  revalidatePath(`/${locale}/dashboard/student/payments`);
  revalidatePath(`/${locale}/dashboard/admin/finance`);
  return { ok: true };
}
