import type { Locale } from "@/types/i18n";

/** Reads `locale` from an unknown payload when Zod has not validated yet. */
export function pickLocaleFromUnknownPayload(raw: unknown): Locale {
  if (typeof raw === "object" && raw !== null && "locale" in raw) {
    const l = String((raw as { locale: string }).locale).toLowerCase();
    if (l === "en" || l === "es") return l;
  }
  return "es";
}
