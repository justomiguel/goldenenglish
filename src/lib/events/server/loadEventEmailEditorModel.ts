import "server-only";

import { getEmailTemplateDefinition } from "@/lib/email/templates/templateRegistry";
import {
  EVENT_EMAIL_TEMPLATE_KEYS,
  type EventEmailCopyRow,
  type EventEmailLocale,
  type EventEmailTemplateKey,
} from "@/lib/events/eventEmailCopy";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/types/i18n";

const LOCALES: EventEmailLocale[] = ["es", "en", "pt"];

export interface EventEmailEditorModel {
  copies: EventEmailCopyRow[];
  fallbacks: Record<EventEmailTemplateKey, Record<EventEmailLocale, { subject: string; bodyHtml: string }>>;
}

export async function loadEventEmailEditorModel(eventId: string): Promise<EventEmailEditorModel> {
  const fallbacks = emptyFallbacks();
  try {
    const admin = await createAdminClient();
    const [copiesResult, catalogResult] = await Promise.all([
      admin
        .from("event_email_templates")
        .select("template_key, locale, flow_id, subject, body_html")
        .eq("event_id", eventId)
        .limit(200),
      admin
        .from("email_templates")
        .select("template_key, locale, subject, body_html")
        .in("template_key", [...EVENT_EMAIL_TEMPLATE_KEYS]),
    ]);
    if (copiesResult.error) {
      logSupabaseClientError("loadEventEmailEditorModel:copies", copiesResult.error, { eventId });
    }
    if (catalogResult.error) {
      logSupabaseClientError("loadEventEmailEditorModel:catalog", catalogResult.error, { eventId });
    }
    applyCatalogOverrides(fallbacks, catalogResult.data ?? []);
    return {
      fallbacks,
      copies: (copiesResult.data ?? []).flatMap((row) => {
        const templateKey = String(row.template_key);
        if (!isTemplateKey(templateKey)) return [];
        return [
          {
            templateKey,
            locale: String(row.locale),
            flowId: row.flow_id ? String(row.flow_id) : null,
            subject: String(row.subject ?? ""),
            bodyHtml: String(row.body_html ?? ""),
          },
        ];
      }),
    };
  } catch (error) {
    logSupabaseClientError("loadEventEmailEditorModel", error as { message?: string }, { eventId });
    return { copies: [], fallbacks };
  }
}

function emptyFallbacks(): EventEmailEditorModel["fallbacks"] {
  const fallbacks = {} as EventEmailEditorModel["fallbacks"];
  for (const key of EVENT_EMAIL_TEMPLATE_KEYS) {
    const defaults = getEmailTemplateDefinition(key)?.defaults;
    fallbacks[key] = {
      es: copyOf(defaults?.es),
      en: copyOf(defaults?.en),
      pt: copyOf(defaults?.pt),
    };
  }
  return fallbacks;
}

function copyOf(value: { subject: string; bodyHtml: string } | undefined): { subject: string; bodyHtml: string } {
  return { subject: value?.subject ?? "", bodyHtml: value?.bodyHtml ?? "" };
}

function applyCatalogOverrides(
  fallbacks: EventEmailEditorModel["fallbacks"],
  rows: { template_key: string; locale: string; subject: string; body_html: string }[],
): void {
  for (const row of rows) {
    if (!isTemplateKey(row.template_key) || !isLocale(row.locale)) continue;
    fallbacks[row.template_key][row.locale] = {
      subject: row.subject,
      bodyHtml: row.body_html,
    };
  }
}

function isTemplateKey(value: string): value is EventEmailTemplateKey {
  return (EVENT_EMAIL_TEMPLATE_KEYS as readonly string[]).includes(value);
}

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
