import "server-only";

import type { EmailProvider } from "@/lib/email/emailProvider";
import { getBrandForRequest } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { wrapEmailHtml } from "@/lib/email/templates/wrapEmailHtml";
import type { Locale } from "@/types/i18n";

export async function sendAdminSiteContactVisitorReplyEmail(input: {
  locale: Locale;
  toEmail: string;
  subject: string;
  /** Sanitized fragment HTML (messaging subset). */
  bodyHtml: string;
  emailProvider: EmailProvider;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const brand = await getBrandForRequest();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const html = wrapEmailHtml({
    brand,
    origin,
    locale: input.locale,
    bodyHtml: input.bodyHtml,
  });

  const r = await input.emailProvider.sendEmail({
    to: input.toEmail,
    subject: input.subject,
    html,
  });

  if (!r.ok) return { ok: false, error: r.error ?? "email_failed" };
  return { ok: true };
}
