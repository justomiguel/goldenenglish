import type { BrandPublic } from "@/lib/brand/server";
import type { EmailProvider, SendEmailResult } from "@/lib/email/emailProvider";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import type { Locale } from "@/types/i18n";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function asLocale(value: string): Locale {
  if (value === "en" || value === "pt") return value;
  return "es";
}

export interface SendAdminPasswordResetNoticeEmailParams {
  to: string;
  brand: BrandPublic;
  locale: string;
  emailProvider: EmailProvider;
}

export async function sendAdminPasswordResetNoticeEmail(
  params: SendAdminPasswordResetNoticeEmailParams,
): Promise<SendEmailResult> {
  const r = await sendBrandedEmail({
    to: params.to,
    templateKey: "notifications.admin_password_reset",
    locale: asLocale(params.locale),
    emailProvider: params.emailProvider,
    vars: {
      brandName: escapeHtml(params.brand.name),
      email: escapeHtml(params.to),
      contactEmail: escapeHtml(params.brand.contactEmail || ""),
    },
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}
