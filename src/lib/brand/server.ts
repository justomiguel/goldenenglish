import { getProperty, loadProperties } from "@/lib/theme/themeParser";

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

export function getBrandPublic(): BrandPublic {
  const p = loadProperties();
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
