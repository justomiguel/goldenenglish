export const EVENT_LOCALES = ["es", "en", "pt"] as const;

export type EventLocale = (typeof EVENT_LOCALES)[number];

export function isEventLocale(value: string): value is EventLocale {
  return (EVENT_LOCALES as readonly string[]).includes(value);
}

export interface EventTranslationRow {
  locale: EventLocale;
  title: string;
  description: string;
  location: string | null;
}
