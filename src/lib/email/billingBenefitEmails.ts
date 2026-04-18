import { getBillingTerms } from "@/lib/billing/getBillingTerms";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";

async function collectRecipientEmailsForStudent(studentId: string): Promise<string[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logServerException("collectRecipientEmailsForStudent:createAdminClient", err);
    return [];
  }
  const emails = new Set<string>();

  const { data: studentUser } = await admin.auth.admin.getUserById(studentId);
  if (studentUser.user?.email) emails.add(studentUser.user.email);

  const { data: links } = await admin
    .from("tutor_student_rel")
    .select("tutor_id")
    .eq("student_id", studentId);

  for (const row of links ?? []) {
    const pid = row.tutor_id as string;
    const { data: pu } = await admin.auth.admin.getUserById(pid);
    if (pu.user?.email) emails.add(pu.user.email);
  }

  return [...emails];
}

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
