"use server";

import { revalidatePath } from "next/cache";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { createClient } from "@/lib/supabase/server";
import { paymentActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { resolveTutorStudentLink } from "@/lib/auth/resolveTutorStudentLink";
import { resolveStudentPaymentSlot } from "@/lib/billing/resolveStudentPaymentSlot";
import { logServerException } from "@/lib/logging/serverActionLog";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { notifyPaymentReceiptPending } from "@/lib/email/billingPaymentEmails";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import type { Locale } from "@/types/i18n";

const MAX_BYTES = 4 * 1024 * 1024;

function extFromMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

/**
 * Tutor (perfil `parent`) sube un comprobante en nombre de un alumno
 * vinculado. Reutiliza la misma resolución de slot que el alumno
 * (`resolveStudentPaymentSlot`) para la tira mensual seccionada y, además:
 * - exige vínculo activo en `tutor_student_rel` con acceso financiero (no
 *   revocado por el alumno mayor),
 * - sube siempre bajo `payment-receipts/{studentId}/...` para que la URL
 *   firmada sirva al alumno y al tutor (RLS Storage cubre ambos),
 * - deja `parent_id = tutorId` como traza en `payments`.
 */
export async function submitTutorPaymentReceipt(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const pe = await paymentActionDict(formData);
  const locale = localeFromFormData(formData);
  const studentId = String(formData.get("studentId") ?? "").trim();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  const file = formData.get("receipt");

  if (!studentId || !Number.isFinite(month) || !Number.isFinite(year)) {
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
  if (profile?.role !== "parent") return { ok: false, message: pe.forbidden };

  const link = await resolveTutorStudentLink(supabase, user.id, studentId);
  if (!link.linked) return { ok: false, message: pe.studentNotLinked };
  if (!link.financialAccessActive) return { ok: false, message: pe.forbidden };

  const sectionIdRaw = formData.get("sectionId");
  const sectionId =
    typeof sectionIdRaw === "string" && sectionIdRaw.trim().length > 0
      ? sectionIdRaw.trim()
      : null;

  const slot = await resolveStudentPaymentSlot(supabase, {
    studentId,
    sectionId,
    month,
    year,
    fallbackAmount: amount,
  });
  if (!slot.ok) {
    if (slot.reason === "forbidden") return { ok: false, message: pe.forbidden };
    if (slot.reason === "already_processed") {
      return { ok: false, message: pe.alreadyProcessed };
    }
    if (slot.reason === "month_exempt") return { ok: false, message: pe.monthExempt };
    if (slot.reason === "upload_failed") {
      return { ok: false, message: pe.uploadFailed };
    }
    return { ok: false, message: pe.slotNotFound };
  }
  const pay = slot.payment;
  const effectiveAmount = slot.effectiveAmount;

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = extFromMime(mime);
  const path = `${studentId}/${pay.id}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("payment-receipts")
    .upload(path, buf, { contentType: mime, upsert: false });

  if (upErr) return { ok: false, message: pe.uploadFailed };

  const { error: upRow } = await supabase
    .from("payments")
    .update({
      receipt_url: path,
      amount: effectiveAmount,
      parent_id: user.id,
    })
    .eq("id", pay.id)
    .eq("status", "pending");

  if (upRow) return { ok: false, message: pe.uploadFailed };

  revalidatePath(`/${locale}/dashboard/parent/payments`);
  revalidatePath(`/${locale}/dashboard/student/payments`);

  void recordUserEventServer({
    userId: user.id,
    eventType: "action",
    entity: AnalyticsEntity.paymentReceiptSubmittedTutor,
    metadata: {
      student_id: studentId,
      month,
      year,
      receipt_kind: mime === "application/pdf" ? "pdf" : "image",
      ...(sectionId ? { section_id: sectionId } : {}),
    },
  });

  const outLocale: Locale = locale === "en" || locale === "es" ? locale : (defaultLocale as Locale);
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
          studentId,
          sectionId,
          year,
          month,
        );
        if (pl.code === "ok") currency = pl.currency;
      }
      await notifyPaymentReceiptPending({
        studentId,
        locale: outLocale,
        month,
        year,
        amount: effectiveAmount,
        currency,
        sectionName,
      });
    } catch (e) {
      logServerException("submitTutorPaymentReceipt:notify", e, { studentId, tutorId: user.id });
    }
  })();
  return { ok: true };
}
