"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
import {
  logServerAuthzDenied,
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { auditFinanceAction } from "@/lib/audit";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import { resolveSectionPlanMonthlyAmount } from "@/lib/billing/resolveSectionPlanMonthlyAmount";
import { notifyMonthlyPaymentDecision } from "@/lib/email/billingPaymentEmails";
import type { Locale } from "@/types/i18n";
import { resolvePaymentActionLocale } from "@/app/[locale]/dashboard/admin/payments/paymentActionLocale";

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
    .select("id, student_id, parent_id, month, year, amount, status, admin_notes, section_id, gateway_provider")
    .eq("id", parsed.data.paymentId)
    .maybeSingle();

  // Deferred creation: gateway-confirmed tuition rows (Mercado Pago / Flow) are
  // materialized directly as `approved`; they are not manual receipts and must
  // not be re-reviewed from the receipts inbox.
  if (beforePayment?.gateway_provider) {
    logServerAuthzDenied("reviewPayment:gateway_managed");
    return { ok: false, message: errDict.actionErrors.paymentsReview.gatewayManaged };
  }

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

const bulkReviewSchema = z.object({
  paymentIds: z.array(z.string().uuid()).min(1).max(80),
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(2000).optional(),
  locale: z.string().min(2).max(8),
});

/** Payment inbox: approve or reject many pending monthly receipts at once. */
export async function bulkReviewMonthlyPayments(
  raw: unknown,
): Promise<{ ok: boolean; processed: number; message?: string }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("bulkReviewMonthlyPayments");
    const dict = await getDictionary(defaultLocale);
    return { ok: false, processed: 0, message: dict.actionErrors.paymentsReview.forbidden };
  }

  const parsed = bulkReviewSchema.safeParse(raw);
  if (!parsed.success) {
    const dict = await getDictionary(defaultLocale);
    return { ok: false, processed: 0, message: dict.actionErrors.paymentsReview.invalidData };
  }

  const { paymentIds, status, adminNotes, locale } = parsed.data;
  let processed = 0;
  for (const paymentId of paymentIds) {
    const r = await reviewPayment({
      paymentId,
      status,
      adminNotes: adminNotes || undefined,
      locale,
    });
    if (r.ok) processed += 1;
  }

  const loc = resolvePaymentActionLocale(locale);
  revalidatePath(`/${loc}/dashboard/admin/finance`);

  return { ok: processed > 0, processed };
}
