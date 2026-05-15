import type { Locale } from "@/types/i18n";

export type EmailTemplateLocalePack = { subject: string; bodyHtml: string };

/** PT defaults reuse ES bodies until dedicated Portuguese proofreading exists for transactional mail. */
export function withPtFallback(defaults: {
  es: EmailTemplateLocalePack;
  en: EmailTemplateLocalePack;
}): Record<Locale, EmailTemplateLocalePack> {
  return { es: defaults.es, en: defaults.en, pt: defaults.es };
}
