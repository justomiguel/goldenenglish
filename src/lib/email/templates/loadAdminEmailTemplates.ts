import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EmailTemplateDefinition,
  EmailTemplateOverrideRow,
} from "@/types/emailTemplates";
import type { Locale } from "@/types/i18n";
import { listEmailTemplateDefinitions } from "@/lib/email/templates/templateRegistry";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface AdminEmailTemplateEntry {
  definition: EmailTemplateDefinition;
  overridesByLocale: Record<Locale, EmailTemplateOverrideRow | null>;
}

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
 * Devuelve el catálogo completo (registry) cruzado con sus overrides en BD.
 * El caller debe pasar un cliente Supabase ya autenticado (típicamente el
 * proveniente de `assertAdmin()`), respetando `12-supabase-app-boundaries`.
 */
export async function loadAdminEmailTemplates(
  supabase: SupabaseClient,
): Promise<AdminEmailTemplateEntry[]> {
  const definitions = listEmailTemplateDefinitions();
  const keys = definitions.map((d) => d.key);

  let overrides: EmailTemplateOverrideRow[] = [];
  if (keys.length > 0) {
    const { data, error } = await supabase
      .from("email_templates")
      .select("template_key, locale, subject, body_html, updated_at, updated_by")
      .in("template_key", keys);
    if (error) {
      logSupabaseClientError("loadAdminEmailTemplates:select", error);
    } else {
      overrides = (data ?? []).map((r) => rowToOverride(r as RawOverrideRow));
    }
  }

  const overrideIndex = new Map<string, EmailTemplateOverrideRow>();
  for (const o of overrides) {
    overrideIndex.set(`${o.templateKey}::${o.locale}`, o);
  }

  return definitions.map((definition) => ({
    definition,
    overridesByLocale: {
      es: overrideIndex.get(`${definition.key}::es`) ?? null,
      en: overrideIndex.get(`${definition.key}::en`) ?? null,
    },
  }));
}
