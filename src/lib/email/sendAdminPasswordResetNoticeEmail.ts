import type { BrandPublic } from "@/lib/brand/server";
import type { EmailProvider, SendEmailResult } from "@/lib/email/emailProvider";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fillTemplate } from "@/lib/i18n/fillTemplate";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface SendAdminPasswordResetNoticeEmailParams {
  to: string;
  brand: BrandPublic;
  locale: string;
  emailProvider: EmailProvider;
}

/**
 * Notify the account holder that a staff member used the admin "reset by DNI"
 * flow on their account. Sent only when `to` is a real (non-synthetic) address
 * — synthetic mailboxes (`@students.goldenenglish.local`, etc.) are skipped
 * upstream because they would bounce.
 */
export async function sendAdminPasswordResetNoticeEmail(
  params: SendAdminPasswordResetNoticeEmailParams,
): Promise<SendEmailResult> {
  const dict = await getDictionary(params.locale);
  const t = dict.emailAdminPasswordResetNotice;
  const subject = fillTemplate(t.subject, { brandName: params.brand.name });
  const html = fillTemplate(t.html, {
    brandName: escapeHtml(params.brand.name),
    email: escapeHtml(params.to),
    contactEmail: escapeHtml(params.brand.contactEmail || ""),
  });
  return params.emailProvider.sendEmail({ to: params.to, subject, html });
}
