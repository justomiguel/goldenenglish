import type { AppLocale } from "@/lib/i18n/dictionaries";
import { locales } from "@/lib/i18n/dictionaries";
import {
  emptyMessagingDefaultReplyTemplates,
  type MessagingDefaultReplyTemplates,
} from "@/lib/messaging/messagingDefaultReplyConstants";

function readLocaleMap(
  raw: Record<string, unknown>,
  factories: MessagingDefaultReplyTemplates,
): MessagingDefaultReplyTemplates {
  const out = emptyMessagingDefaultReplyTemplates(factories);
  for (const loc of locales) {
    const v = raw[loc];
    if (typeof v === "string" && v.trim().length > 0) {
      out[loc] = v.trim();
    }
  }
  return out;
}

/**
 * Parses `site_settings.value` for messaging_default_reply_template.
 * Supports `{ templates: { es, en, pt } }` and legacy `{ template: "…" }` / raw string.
 */
export function parseMessagingDefaultReplySetting(
  raw: unknown,
  factories: MessagingDefaultReplyTemplates,
): MessagingDefaultReplyTemplates {
  const fallback = emptyMessagingDefaultReplyTemplates(factories);

  if (raw == null) return fallback;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return fallback;
    return { es: trimmed, en: trimmed, pt: trimmed };
  }

  if (typeof raw !== "object") return fallback;

  const obj = raw as Record<string, unknown>;

  if (obj.templates && typeof obj.templates === "object" && obj.templates !== null) {
    return readLocaleMap(obj.templates as Record<string, unknown>, factories);
  }

  if (typeof obj.template === "string" && obj.template.trim().length > 0) {
    const t = obj.template.trim();
    return { es: t, en: t, pt: t };
  }

  // Flat { es, en, pt } without wrapper
  const hasFlat = locales.some((l) => typeof obj[l] === "string");
  if (hasFlat) {
    return readLocaleMap(obj, factories);
  }

  return fallback;
}

export function templatesPayload(
  templates: MessagingDefaultReplyTemplates,
): { templates: MessagingDefaultReplyTemplates } {
  const cleaned = {} as MessagingDefaultReplyTemplates;
  for (const loc of locales) {
    cleaned[loc as AppLocale] = templates[loc as AppLocale].trim();
  }
  return { templates: cleaned };
}
