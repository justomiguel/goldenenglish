import { isEventLocale, type EventLocale, type EventTranslationRow } from "@/lib/events/domain";

export interface EventTranslationFallback {
  title: string;
  description: string;
  location: string | null;
  defaultLocale: EventLocale;
}

export interface ResolvedEventTranslation {
  title: string;
  description: string;
  location: string | null;
  localeUsed: EventLocale;
}

export function resolveEventTranslation(
  translations: EventTranslationRow[],
  fallback: EventTranslationFallback,
  requestedLocale: string,
): ResolvedEventTranslation {
  const byLocale = new Map(translations.map((row) => [row.locale, row]));
  const preferred = isEventLocale(requestedLocale) ? requestedLocale : fallback.defaultLocale;
  const chain: EventLocale[] = [preferred, fallback.defaultLocale, "es", "en", "pt"];

  for (const locale of chain) {
    const row = byLocale.get(locale);
    if (row?.title.trim()) {
      return {
        title: row.title,
        description: row.description,
        location: row.location,
        localeUsed: locale,
      };
    }
  }

  return {
    title: fallback.title,
    description: fallback.description,
    location: fallback.location,
    localeUsed: fallback.defaultLocale,
  };
}
