import "server-only";

import type { EmailProvider } from "@/lib/email/emailProvider";
import { sendWrappedHtmlEmail } from "@/lib/email/templates/sendWrappedHtmlEmail";
import type { Locale } from "@/types/i18n";

export async function sendAdminSiteContactVisitorReplyEmail(input: {
  locale: Locale;
  toEmail: string;
  subject: string;
  /** Sanitized fragment HTML (messaging subset). */
  bodyHtml: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await sendWrappedHtmlEmail({
    to: input.toEmail,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    locale: input.locale,
    emailProvider: input.emailProvider,
  });

  if (!r.ok) return { ok: false, error: r.error ?? "email_failed" };
  return { ok: true };
}
