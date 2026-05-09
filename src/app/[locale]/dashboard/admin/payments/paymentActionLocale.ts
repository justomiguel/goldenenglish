import { defaultLocale } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/types/i18n";

export function resolvePaymentActionLocale(s: string): Locale {
  return s === "en" || s === "es" ? s : (defaultLocale as Locale);
}
