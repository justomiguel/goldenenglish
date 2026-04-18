import "server-only";
import type { EmailProvider, SendEmailResult } from "@/lib/email/emailProvider";
import { getEmailProvider } from "@/lib/email/getEmailProvider";
import { getBrandPublic } from "@/lib/brand/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { loadEmailTemplate } from "@/lib/email/templates/loadEmailTemplate";
import { wrapEmailHtml } from "@/lib/email/templates/wrapEmailHtml";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";
import type { EmailTemplateKey } from "@/types/emailTemplates";

export interface SendBrandedEmailInput {
  to: string;
  templateKey: EmailTemplateKey;
  locale: Locale;
  vars?: Record<string, string>;
  /** Opcional: usar otro provider (tests). */
  emailProvider?: EmailProvider;
}

export type SendBrandedEmailResult =
  | { ok: true; fromOverride: boolean }
  | { ok: false; error: string };

/**
 * Punto único para enviar emails al cliente final con branding y layout
 * unificados. Resuelve la plantilla (BD override → registry default), aplica
 * el wrapper minimalista con logo + nombre del instituto y delega el envío
 * al `EmailProvider` configurado (Resend en runtime).
 *
 * Los emisores existentes (mensajería, billing, churn, recordatorios,
 * traslados, calificaciones) llaman a esta función en lugar de armar HTML
 * inline, garantizando que cualquier email que vea el cliente comparta look
 * & feel y que el copy sea editable desde admin sin redeploy.
 */
export async function sendBrandedEmail(
  input: SendBrandedEmailInput,
): Promise<SendBrandedEmailResult> {
  const resolved = await loadEmailTemplate({
    key: input.templateKey,
    locale: input.locale,
    vars: input.vars,
  });
  if (!resolved) {
    logServerException("sendBrandedEmail:unknownKey", new Error(input.templateKey));
    return { ok: false, error: "unknown_template_key" };
  }

  const brand = getBrandPublic();
  const origin = getPublicSiteUrl()?.origin ?? "http://localhost:3000";
  const html = wrapEmailHtml({
    brand,
    origin,
    locale: input.locale,
    bodyHtml: resolved.bodyHtml,
  });

  const provider = input.emailProvider ?? getEmailProvider();
  const r: SendEmailResult = await provider.sendEmail({
    to: input.to,
    subject: resolved.subject,
    html,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, fromOverride: resolved.fromOverride };
}
