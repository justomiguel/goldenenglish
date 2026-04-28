"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { z } from "zod";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
import { logServerAuthzDenied, logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditFinanceAction } from "@/lib/audit";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import { notifyMonthlyPaymentDecision } from "@/lib/email/billingPaymentEmails";
import type { Locale } from "@/types/i18n";

const reviewSchema = z.object({
  paymentId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(2000).optional(),
  locale: z.string().min(2).max(8),
});

export async function reviewPayment(
  raw: unknown,
): Promise<{ ok: boolean; message?: string }> {
  let supabase;
  let actorId = "";
  try {
    const ctx = await assertAdmin();
    supabase = ctx.supabase;
    actorId = ctx.user.id;
  } catch {
    logServerAuthzDenied("reviewPayment");
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.paymentsReview.forbidden };
  }

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, message: dict.actionErrors.paymentsReview.invalidData };
  }

  const errDict = await getDictionary(parsed.data.locale);

  const { data: beforePayment } = await supabase
    .from("payments")
    .select("id, student_id, parent_id, month, year, amount, status, admin_notes, section_id")
    .eq("id", parsed.data.paymentId)
    .maybeSingle();

  const { error } = await supabase
    .from("payments")
    .update({
      status: parsed.data.status,
      admin_notes: parsed.data.adminNotes ?? null,
    })
    .eq("id", parsed.data.paymentId);

  if (error) {
    logSupabaseClientError("reviewPayment", error, { paymentId: parsed.data.paymentId });
    return { ok: false, message: errDict.actionErrors.paymentsReview.saveFailed };
  }
  void auditFinanceAction({
    actorId,
    actorRole: "admin",
    action: parsed.data.status === "approved" ? "approve" : "reject",
    resourceType: "payment",
    resourceId: parsed.data.paymentId,
    summary: `Admin ${parsed.data.status} payment receipt`,
    beforeValues: {
      status: beforePayment?.status ?? null,
      admin_notes: beforePayment?.admin_notes ?? null,
      amount: beforePayment?.amount ?? null,
    },
    afterValues: {
      status: parsed.data.status,
      admin_notes: parsed.data.adminNotes ?? null,
      amount: beforePayment?.amount ?? null,
    },
    metadata: {
      student_id: beforePayment?.student_id ?? null,
      parent_id: beforePayment?.parent_id ?? null,
      month: beforePayment?.month ?? null,
      year: beforePayment?.year ?? null,
    },
  });

  const loc = (parsed.data.locale === "en" || parsed.data.locale === "es"
    ? parsed.data.locale
    : "es") as Locale;
  const studentId = beforePayment?.student_id;
  if (typeof studentId === "string" && beforePayment && studentId) {
    revalidateStudentBillingPaths(parsed.data.locale, studentId);
    revalidatePath(`/${parsed.data.locale}/dashboard/parent/payments`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student/payments`);
    const month = Number(beforePayment.month);
    const year = Number(beforePayment.year);
    const amt = beforePayment.amount != null ? Number(beforePayment.amount) : 0;
    const sectionId = beforePayment.section_id as string | null;
    void (async () => {
      try {
        let currency = "USD";
        if (sectionId) {
          const plan = await resolveSectionPlanMonthlyAmount(
            supabase,
            studentId,
            sectionId,
            year,
            month,
          );
          if (plan.code === "ok") currency = plan.currency;
        }
        await notifyMonthlyPaymentDecision({
          studentId,
          locale: loc,
          month,
          year,
          amount: amt,
          currency,
          decision: parsed.data.status,
          adminNotes: parsed.data.adminNotes ?? null,
        });
      } catch (e) {
        logServerException("reviewPayment:notify", e, { paymentId: parsed.data.paymentId });
      }
    })();
  }
  return { ok: true };
}

export async function getReceiptSignedUrl(
  objectPath: string,
): Promise<string | null> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("getReceiptSignedUrl");
    return null;
  }

  const trimmed = objectPath.trim();
  if (!trimmed || trimmed.includes("..")) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("payment-receipts")
    .createSignedUrl(trimmed, 300);

  if (error || !data?.signedUrl) {
    if (error) logSupabaseClientError("getReceiptSignedUrl:storage", error, { path: trimmed });
    return null;
  }
  return data.signedUrl;
}
