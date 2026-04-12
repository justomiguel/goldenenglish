import { getBrandPublic } from "@/lib/brand/server";
import { getBillingTerms } from "@/lib/billing/getBillingTerms";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fillTemplate } from "@/lib/i18n/fillTemplate";
import type { Locale } from "@/types/i18n";

async function collectRecipientEmailsForStudent(studentId: string): Promise<string[]> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
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

function wrapHtml(title: string, bodyLines: string[]) {
  const brand = getBrandPublic();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#103A5C;">
<p style="font-weight:600;">${brand.name}</p>
<h1 style="font-size:1.25rem;">${title}</h1>
${bodyLines.map((l) => `<p>${l}</p>`).join("")}
<p style="margin-top:2rem;font-size:0.875rem;color:#6B7280;">${brand.contactEmail}</p>
</body></html>`;
}

export async function sendEnrollmentExemptionEmail(opts: {
  studentId: string;
  locale: Locale;
  reason: string | null;
}): Promise<void> {
  const toList = await collectRecipientEmailsForStudent(opts.studentId);
  if (toList.length === 0) return;

  const terms = getBillingTerms(opts.locale);
  const brand = getBrandPublic();
  const provider = getEmailProvider();
  const dict = await getDictionary(opts.locale);
  const eb = dict.emailBilling;
  const subject = `${brand.name}: ${fillTemplate(eb.enrollmentExemptionSubjectSuffix, {
    enrollmentTerm: terms.enrollment,
  })}`;

  const bodyLines = [
    fillTemplate(eb.enrollmentExemptionBody, {
      enrollmentTermLower: terms.enrollment.toLowerCase(),
    }),
    opts.reason?.trim()
      ? fillTemplate(eb.enrollmentExemptionNote, { reason: opts.reason.trim() })
      : "",
  ].filter(Boolean);

  const html = wrapHtml(
    fillTemplate(eb.enrollmentExemptionTitle, { enrollmentTerm: terms.enrollment }),
    bodyLines,
  );

  for (const to of toList) {
    await provider.sendEmail({ to, subject, html });
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
  const brand = getBrandPublic();
  const provider = getEmailProvider();
  const dict = await getDictionary(opts.locale);
  const eb = dict.emailBilling;
  const subject = `${brand.name}: ${fillTemplate(eb.promotionAppliedSubjectSuffix, {
    promotionTerm: terms.promotion,
  })}`;

  const html = wrapHtml(
    fillTemplate(eb.promotionAppliedTitle, { promotionTerm: terms.promotion }),
    [
      fillTemplate(eb.promotionAppliedBody, {
        promotionTermLower: terms.promotion.toLowerCase(),
        promotionName: opts.promotionName,
        code: opts.codeSnapshot,
      }),
    ],
  );

  for (const to of toList) {
    await provider.sendEmail({ to, subject, html });
  }
}
