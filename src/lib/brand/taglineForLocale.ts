import type { BrandPublic } from "@/lib/brand/server";

/** Marketing tagline from `SYSTEM_PROPERTIES_DEFAULTS` (`app.tagline` / `app.tagline.en`) + active theme overrides. */
export function taglineForLocale(brand: BrandPublic, locale: string): string {
  return locale === "en" ? brand.taglineEn : brand.tagline;
}
