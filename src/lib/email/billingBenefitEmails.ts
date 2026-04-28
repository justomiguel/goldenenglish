import { getBillingTerms } from "@/lib/billing/getBillingTerms";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { collectRecipientEmailsForStudent } from "@/lib/email/billingEmailRecipients";
import type { Locale } from "@/types/i18n";

export async function sendEnrollmentExemptionEmail(opts: {
  studentId: string;
  locale: Locale;
  reason: string | null;
}): Promise<void> {
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;

  const terms = getBillingTerms(opts.locale);
  const reason = opts.reason?.trim() ?? "";

  for (const to of toList) {
    await sendBrandedEmail({
      to,
      templateKey: "billing.enrollment_exemption",
      locale: opts.locale,
      vars: {
        enrollmentTerm: terms.enrollment,
        enrollmentTermLower: terms.enrollment.toLowerCase(),
        reason,
      },
    });
  }
}

export async function sendPromotionAppliedEmail(opts: {
  studentId: string;
  locale: Locale;
  promotionName: string;
  codeSnapshot: string;
}): Promise<void> {
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;

  const terms = getBillingTerms(opts.locale);

  for (const to of toList) {
    await sendBrandedEmail({
      to,
      templateKey: "billing.promotion_applied",
      locale: opts.locale,
      vars: {
        promotionTerm: terms.promotion,
        promotionTermLower: terms.promotion.toLowerCase(),
        promotionName: opts.promotionName,
        code: opts.codeSnapshot,
      },
    });
  }
}
