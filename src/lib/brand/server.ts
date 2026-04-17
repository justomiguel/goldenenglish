import {
  getProperty,
  loadProperties,
  type ThemeProperties,
} from "@/lib/theme/themeParser";

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
  /** Canonical .ico URL (see `public/favicon_io/`). */
  faviconPath: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialFacebook: string;
  socialInstagram: string;
  socialWhatsapp: string;
}

/**
 * Pure: derives the public brand object from a properties map. Used by:
 *  - `getBrandPublic()` (sync wrapper, file-only) for callers that don't need
 *    runtime overrides.
 *  - The root `app/layout.tsx`, which feeds in the merged `system.properties +
 *    site_themes.properties` map produced by `loadEffectiveProperties()`.
 *
 * Keeping it pure removes the `fs` dependency for tests and lets the same
 * brand object reflect a freshly activated theme without restarting the app.
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
    logoPath: getProperty(p, "app.logo.path", "/images/logo.png"),
    logoAlt: getProperty(p, "app.logo.alt"),
    faviconPath: getProperty(p, "app.favicon.path", "/favicon_io/favicon.ico"),
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
