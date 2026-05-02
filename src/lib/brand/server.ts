import { cache } from "react";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";
import {
  getProperty,
  loadProperties,
  type ThemeProperties,
} from "@/lib/theme/themeParser";

const LOGO_FALLBACK = "/images/logo.png";
const FAV_FALLBACK = "/favicon_io/favicon.ico";

export interface BrandPublic {
  name: string;
  legalName: string;
  /** Primary tagline (Spanish / default locale copy from `app.tagline`). */
  tagline: string;
  /** English marketing tagline (`app.tagline.en`); falls back to `tagline` if unset. */
  taglineEn: string;
  legalRegistry: string;
  logoPath: string;
  logoAlt: string;
  /** Favicon URL — site-relative, Storage (`resolveBrandAssetUrl`), or absolute. */
  faviconPath: string;
  /**
   * Storage object prefix (`landing-media` bucket) when a favicon.io ZIP was saved.
   * Siblings: `favicon.ico`, PNG sizes, `apple-touch-icon.png`, etc.
   */
  faviconBundlePrefix: string | null;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialFacebook: string;
  socialInstagram: string;
  socialWhatsapp: string;
}

/**
 * Pure: derives the public brand object from a properties map. Used by:
 *  - `getBrandPublic()` — sync, file defaults only (tests / explicit sync paths).
 *  - `getBrandForRequest()` — merged `system.properties + site_themes.properties`.
 *  - Root `app/layout.tsx` when feeding merged props from `loadEffectiveProperties()`.
 *
 * Reads only `process.env` for Storage URL resolution (`resolveBrandAssetUrl`);
 * no network or filesystem I/O.
 */
export function brandPublicFromProperties(p: ThemeProperties): BrandPublic {
  const tagline = getProperty(p, "app.tagline");
  const taglineEn = getProperty(p, "app.tagline.en", tagline);
  return {
    name: getProperty(p, "app.name"),
    legalName: getProperty(p, "app.legal.name"),
    tagline,
    taglineEn,
    legalRegistry: getProperty(p, "app.legal.registry"),
    logoPath: resolveBrandAssetUrl(
      getProperty(p, "app.logo.path", LOGO_FALLBACK),
      LOGO_FALLBACK,
    ),
    logoAlt: getProperty(p, "app.logo.alt"),
    faviconPath: resolveBrandAssetUrl(
      getProperty(p, "app.favicon.path", FAV_FALLBACK),
      FAV_FALLBACK,
    ),
    faviconBundlePrefix: (() => {
      const raw = getProperty(p, "app.favicon.bundle.prefix", "").trim();
      return raw.length > 0 ? raw : null;
    })(),
    contactEmail: getProperty(p, "contact.email"),
    contactPhone: getProperty(p, "contact.phone"),
    contactAddress: getProperty(p, "contact.address"),
    socialFacebook: getProperty(p, "social.facebook"),
    socialInstagram: getProperty(p, "social.instagram"),
    socialWhatsapp: getProperty(p, "social.whatsapp"),
  };
}

export function getBrandPublic(): BrandPublic {
  return brandPublicFromProperties(loadProperties());
}

/**
 * Brand for the current request: file defaults overlaid with the active
 * `site_themes` row (same merge as CSS tokens). Cached per React request via `cache()`.
 */
export const getBrandForRequest = cache(async (): Promise<BrandPublic> => {
  const { loadEffectiveProperties } = await import(
    "@/lib/theme/loadEffectiveProperties"
  );
  const { properties } = await loadEffectiveProperties();
  return brandPublicFromProperties(properties);
});
