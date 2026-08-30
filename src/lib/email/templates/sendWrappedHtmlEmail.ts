import "server-only";
import type { EmailProvider, SendEmailResult } from "@/lib/email/emailProvider";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { getBrandForRequest } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { wrapEmailHtml } from "@/lib/email/templates/wrapEmailHtml";
import type { Locale } from "@/types/i18n";

export type SendWrappedHtmlEmailInput = {
  to: string;
  subject: string;
  bodyHtml: string;
  locale: Locale;
  emailProvider?: EmailProvider;
  cc?: string[];
  bcc?: string[];
};

/** Branded chrome around a staff-composed or already-resolved HTML fragment. */
export async function sendWrappedHtmlEmail(
  input: SendWrappedHtmlEmailInput,
): Promise<SendEmailResult> {
  const brand = await getBrandForRequest();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const html = wrapEmailHtml({
    brand,
    origin,
    locale: input.locale,
    bodyHtml: input.bodyHtml,
  });
  const provider = input.emailProvider ?? getEmailProvider();
  return provider.sendEmail({
    to: input.to,
    subject: input.subject,
    html,
    ...(input.cc?.length ? { cc: input.cc } : {}),
    ...(input.bcc?.length ? { bcc: input.bcc } : {}),
  });
}
