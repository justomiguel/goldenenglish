import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fillTemplate } from "@/lib/i18n/fillTemplate";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";
import type {
  EmailTemplateKey,
  EmailTemplateOverrideRow,
  ResolvedEmailTemplate,
} from "@/types/emailTemplates";
import { getEmailTemplateDefinition } from "@/lib/email/templates/templateRegistry";

interface RawOverrideRow {
  template_key: string;
  locale: string;
  subject: string;
  body_html: string;
  updated_at: string;
  updated_by: string | null;
}

function rowToOverride(r: RawOverrideRow): EmailTemplateOverrideRow {
  return {
    templateKey: r.template_key,
    locale: r.locale as Locale,
    subject: r.subject,
    bodyHtml: r.body_html,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  };
}

/**
 * Devuelve el override en BD para (key, locale) o `null` si no existe.
 * Tolerante a errores transitorios de Supabase: en caso de fallo loguea y
 * devuelve `null` para que el caller caiga al default del registry.
 */
export async function fetchEmailTemplateOverride(input: {
  key: EmailTemplateKey;
  locale: Locale;
}): Promise<EmailTemplateOverrideRow | null> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logSupabaseClientError("fetchEmailTemplateOverride:admin", err as { message?: string }, {
      key: input.key,
    });
    return null;
  }
  const { data, error } = await admin
    .from("email_templates")
    .select("template_key, locale, subject, body_html, updated_at, updated_by")
    .eq("template_key", input.key)
    .eq("locale", input.locale)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("fetchEmailTemplateOverride:select", error, { key: input.key });
    return null;
  }
  if (!data) return null;
  return rowToOverride(data as RawOverrideRow);
}

/**
 * Resuelve la plantilla efectiva (override de BD si existe, sino default del
 * registry) y aplica `fillTemplate` con los `vars`. No envuelve en layout: ese
 * paso lo hace `wrapEmailHtml` desde `sendBrandedEmail`.
 */
export async function loadEmailTemplate(input: {
  key: EmailTemplateKey;
  locale: Locale;
  vars?: Record<string, string>;
}): Promise<ResolvedEmailTemplate | null> {
  const def = getEmailTemplateDefinition(input.key);
  if (!def) return null;

  const override = await fetchEmailTemplateOverride({ key: input.key, locale: input.locale });
  const base = override
    ? { subject: override.subject, bodyHtml: override.bodyHtml }
    : def.defaults[input.locale];

  const vars = input.vars ?? {};
  return {
    templateKey: input.key,
    locale: input.locale,
    subject: fillTemplate(base.subject, vars),
    bodyHtml: fillTemplate(base.bodyHtml, vars),
    fromOverride: Boolean(override),
  };
}
