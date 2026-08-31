"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { paymentActionDict, localeFromFormData } from "@/lib/i18n/actionErrors";
import { resolveTutorStudentLink } from "@/lib/auth/resolveTutorStudentLink";
import { resolveStudentPaymentSlot } from "@/lib/billing/resolveStudentPaymentSlot";
import {
  loadParentMonthlyReviewCharge,
  parseParentMonthlyReviewForm,
} from "@/lib/billing/loadParentMonthlyReviewCharge";
import { notifyPaymentReceiptPending } from "@/lib/email/billingPaymentEmails";
import { logServerException } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import { maybeRecordReviewTrialCredit } from "@/lib/billing/maybeRecordReviewTrialCredit";
import { settleParentMonthlyReviewByTrialCredit } from "@/lib/billing/settleParentMonthlyReviewByTrialCredit";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types/i18n";

const MAX_BYTES = 4 * 1024 * 1024;

function extFromMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export async function submitTutorMonthlyReviewReceipt(
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const pe = await paymentActionDict(formData);
  const locale = localeFromFormData(formData);
  const parsed = parseParentMonthlyReviewForm(formData);
  const file = formData.get("receipt");
  if (!parsed) return { ok: false, message: pe.invalidForm };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: pe.unauthorized };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "parent") return { ok: false, message: pe.forbidden };

  const link = await resolveTutorStudentLink(supabase, user.id, parsed.studentId);
  if (!link.linked) return { ok: false, message: pe.studentNotLinked };
  if (!link.financialAccessActive) return { ok: false, message: pe.forbidden };

  const admin = createAdminClient();
  const charge = await loadParentMonthlyReviewCharge(supabase, parsed, { admin });
  if (!charge.ok) {
    return { ok: false, message: charge.reason === "stale" ? pe.staleSnapshot : pe.invalidForm };
  }

  if (charge.total === 0) {
    const settled = await settleParentMonthlyReviewByTrialCredit({
      admin,
      studentId: charge.studentId,
      month: charge.month,
      year: charge.year,
      lines: charge.lines,
      trialCreditApplied: charge.trialCreditApplied,
      trialCreditRegistrationId: charge.trialCreditRegistrationId,
      actorId: user.id,
    });
    if (!settled.ok) return { ok: false, message: pe.uploadFailed };
    revalidatePath(`/${locale}/dashboard/parent/payments`);
    revalidatePath(`/${locale}/dashboard/student/payments`);
    return { ok: true };
  }

  if (!(file instanceof File) || file.size === 0) return { ok: false, message: pe.receiptRequired };
  if (file.size > MAX_BYTES) return { ok: false, message: pe.fileTooLarge };
  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/") && mime !== "application/pdf") {
    return { ok: false, message: pe.mimeInvalid };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = extFromMime(mime);
  let sharedPath: string | null = null;

  for (const line of charge.lines) {
    const slot = await resolveStudentPaymentSlot(supabase, {
      studentId: charge.studentId,
      sectionId: line.sectionId,
      month: charge.month,
      year: charge.year,
      fallbackAmount: line.amount,
      actingParentIdForInsert: user.id,
    });
    if (!slot.ok) {
      if (slot.reason === "already_processed") return { ok: false, message: pe.alreadyProcessed };
      if (slot.reason === "month_exempt") return { ok: false, message: pe.monthExempt };
      if (slot.reason === "future_month_not_allowed") return { ok: false, message: pe.futureMonthNotAllowed };
      if (slot.reason === "forbidden") return { ok: false, message: pe.forbidden };
      return { ok: false, message: pe.slotNotFound };
    }
    if (!sharedPath) {
      sharedPath = `${charge.studentId}/${slot.payment.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-receipts")
        .upload(sharedPath, buf, { contentType: mime, upsert: false });
      if (upErr) return { ok: false, message: pe.uploadFailed };
    }
    const { error: upRow } = await supabase
      .from("payments")
      .update({
        receipt_url: sharedPath,
        amount: slot.effectiveAmount,
        parent_id: user.id,
      })
      .eq("id", slot.payment.id)
      .eq("status", "pending");
    if (upRow) return { ok: false, message: pe.uploadFailed };

    const outLocale: Locale = locale === "en" || locale === "es" || locale === "pt" ? locale : defaultLocale;
    void notifyPaymentReceiptPending({
      studentId: charge.studentId,
      locale: outLocale,
      month: charge.month,
      year: charge.year,
      amount: slot.effectiveAmount,
      currency: line.currency,
      sectionName: line.sectionName,
    }).catch((e) => {
      logServerException("submitTutorMonthlyReviewReceipt:notify", e, {
        studentId: charge.studentId,
      });
    });
  }

  await maybeRecordReviewTrialCredit({
    admin,
    registrationId: charge.trialCreditRegistrationId,
    applied: charge.trialCreditApplied,
  });

  revalidatePath(`/${locale}/dashboard/parent/payments`);
  revalidatePath(`/${locale}/dashboard/student/payments`);
  return { ok: true };
}
