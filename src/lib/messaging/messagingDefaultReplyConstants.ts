import { defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";

/** site_settings key for institute-wide admin default reply templates. */
export const MESSAGING_DEFAULT_REPLY_SETTING_KEY = "messaging_default_reply_template";

export const MESSAGING_DEFAULT_REPLY_MAX_LENGTH = 2000;

export type MessagingDefaultReplyTemplates = Record<AppLocale, string>;

/** Last-resort English if dictionaries are unavailable in a pure call site. */
export const MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE_EN =
  "Thanks for contacting {{instituteName}}. We will get back to you shortly. For emergencies call {{phone}}.";

export const MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE_ES =
  "Gracias por comunicarte con {{instituteName}}. Nos estaremos comunicando contigo a la brevedad. Para urgencias llamar al {{phone}}.";

export const MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE_PT =
  "Obrigado por entrar em contato com {{instituteName}}. Retornaremos em breve. Para urgências, ligue para {{phone}}.";

export const MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES: MessagingDefaultReplyTemplates = {
  es: MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE_ES,
  en: MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE_EN,
  pt: MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE_PT,
};

/** @deprecated Prefer locale-specific factories; kept for older tests. */
export const MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE = MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE_EN;

export function emptyMessagingDefaultReplyTemplates(
  factories: MessagingDefaultReplyTemplates = MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES,
): MessagingDefaultReplyTemplates {
  return { es: factories.es, en: factories.en, pt: factories.pt };
}

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Pick template for the active site locale, then defaultLocale, then en, then any non-empty.
 */
export function pickMessagingDefaultReplyTemplate(
  templates: MessagingDefaultReplyTemplates,
  locale: string,
): string {
  const ordered: string[] = [
    locale,
    defaultLocale,
    "en",
    ...locales.filter((l) => l !== locale && l !== defaultLocale && l !== "en"),
  ];
  for (const key of ordered) {
    if (!isAppLocale(key)) continue;
    const text = templates[key]?.trim();
    if (text) return text;
  }
  return MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATE_EN;
}
