import type { BrandPublic } from "@/lib/brand/server";

/** Marketing tagline from `system.properties` (`app.tagline` / `app.tagline.en`). */
export function taglineForLocale(brand: BrandPublic, locale: string): string {
  return locale === "en" ? brand.taglineEn : brand.tagline;
}
