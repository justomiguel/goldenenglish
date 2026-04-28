"use server";

import { revalidatePath } from "next/cache";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types/i18n";
import { z } from "zod";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { createClient } from "@/lib/supabase/server";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";
import { paymentActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { notifyPaymentReceiptPending } from "@/lib/email/billingPaymentEmails";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveStudentPaymentSlot } from "@/lib/billing/resolveStudentPaymentSlot";
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
    if (slot.reason === "month_exempt") return { ok: false, message: pe.monthExempt };
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

  const lo = localeFromFormData(formData);
  const outLocale: Locale = lo === "en" || lo === "es" ? lo : (defaultLocale as Locale);
  revalidatePath(`/${outLocale}/dashboard/student/payments`);
  revalidatePath(`/${outLocale}/dashboard/parent/payments`);

  void (async () => {
    try {
      let sectionName: string | null = null;
      let currency = "USD";
      if (sectionId) {
        const { data: s } = await supabase
          .from("academic_sections")
          .select("name")
          .eq("id", sectionId)
          .maybeSingle();
        if (s?.name) sectionName = String(s.name);
        const pl = await resolveSectionPlanMonthlyAmount(
          supabase,
          user.id,
          sectionId,
          year,
          month,
        );
        if (pl.code === "ok") currency = pl.currency;
      }
      await notifyPaymentReceiptPending({
        studentId: user.id,
        locale: outLocale,
        month,
        year,
        amount: effectiveAmount,
        currency,
        sectionName,
      });
    } catch (e) {
      logServerException("submitStudentPaymentReceipt:notify", e, { userId: user.id });
    }
  })();
  return { ok: true };
}

export async function submitEnrollmentFeeReceipt(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const locale = localeFromFormData(formData);
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

  const { error: updErr } = await supabase.rpc("submit_enrollment_fee_receipt", {
    p_student_id: user.id,
    p_enrollment_id: enrollment.id,
    p_section_id: sectionIdParsed.data,
    p_receipt_url: path,
  });

  if (updErr) {
    logSupabaseClientError("submitEnrollmentFeeReceipt:update", updErr, { studentId: user.id });
    return { ok: false, message: pe.uploadFailed };
  }

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.enrollmentFeeReceiptSubmittedStudent,
    metadata: {
      section_id: sectionIdParsed.data,
      receipt_kind: mime === "application/pdf" ? "pdf" : "image",
    },
  });

  revalidatePath(`/${locale}/dashboard/student/payments`);
  revalidatePath(`/${locale}/dashboard/admin/finance`);
  return { ok: true };
}
