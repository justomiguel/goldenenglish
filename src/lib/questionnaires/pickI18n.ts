import { defaultLocale } from "@/lib/i18n/dictionaries";

export function pickI18n(map: Record<string, string> | undefined, locale: string): string {
  if (!map) return "";
  const requested = String(map[locale] ?? "").trim();
  if (requested) return requested;
  const fallback = String(map[defaultLocale] ?? "").trim();
  if (fallback) return fallback;
  for (const value of Object.values(map)) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function pickI18nOptions(
  map: Record<string, string[]> | undefined,
  locale: string,
): string[] {
  if (!map) return [];
  const requested = map[locale];
  if (Array.isArray(requested) && requested.length > 0) return requested;
  const fallback = map[defaultLocale];
  if (Array.isArray(fallback) && fallback.length > 0) return fallback;
  for (const value of Object.values(map)) {
    if (Array.isArray(value) && value.length > 0) return value;
  }
  return [];
}
