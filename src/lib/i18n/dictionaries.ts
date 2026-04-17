import type { Dictionary } from "@/types/i18n";

export const locales = ["es", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "es";

/** Locale JSON files are maintained in parallel; cast keeps `getDictionary` stable if TS infers minor leaf drift. */
const dictionaries: Record<AppLocale, () => Promise<Dictionary>> = {
  es: () => import("@/dictionaries/es.json").then((m) => m.default as Dictionary),
  en: () => import("@/dictionaries/en.json").then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: string): Promise<Dictionary> {
  const key = (locales.includes(locale as AppLocale) ? locale : defaultLocale) as AppLocale;
  return dictionaries[key]();
}
