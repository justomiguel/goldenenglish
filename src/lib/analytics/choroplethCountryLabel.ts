import { alpha3ToAlpha2, getName, registerLocale } from "i18n-iso-countries";
import type { LocaleData } from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import es from "i18n-iso-countries/langs/es.json";

let localesRegistered = false;

function ensureCountryLocalesRegistered() {
  if (localesRegistered) return;
  registerLocale(en as LocaleData);
  registerLocale(es as LocaleData);
  localesRegistered = true;
}

/**
 * Localized country label for the choropleth tooltip (registers i18n-iso-countries locales once).
 */
export function choroplethCountryLabel(
  iso3: string,
  properties: Record<string, unknown> | undefined,
  locale: string,
): string {
  ensureCountryLocalesRegistered();
  const lang = locale === "es" ? "es" : "en";
  const u = iso3.trim().toUpperCase();
  if (u.length === 3 && /^[A-Z]{3}$/.test(u)) {
    const fromLib = getName(u, lang) ?? (alpha3ToAlpha2(u) ? getName(alpha3ToAlpha2(u)!, lang) : undefined);
    if (fromLib) return fromLib;
  }
  const fromGeo = properties?.name;
  if (typeof fromGeo === "string" && fromGeo.trim()) return fromGeo.trim();
  if (u) return u;
  return "";
}
