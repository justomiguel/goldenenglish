import type { CompleteInitialSiteSetupInput } from "@/lib/site/siteSetupCompletionSchema";

export interface SiteSetupOverrideInputs {
  /** Already-validated wizard payload. */
  data: CompleteInitialSiteSetupInput;
  /** Path of the freshly uploaded logo (when present). */
  logoPath: string | null;
  /** Path of the freshly uploaded favicon (when present). */
  favPath: string | null;
  /** When the favicon ZIP branch ran, the bundle prefix to persist. */
  faviconBundlePrefix?: string;
  /** When true, drop any previous `app.favicon.bundle.prefix` (e.g. switching
   *  from ZIP to single favicon). */
  clearFaviconBundlePrefix: boolean;
}

/**
 * Builds the flat `{ key: value }` map written to `site_themes.properties` for
 * the wizard. Only known wizard fields are emitted; the caller merges this on
 * top of the existing overrides and runs `cleanThemeOverridesForPersistence`
 * so the final stored map only contains real deltas vs the system defaults.
 *
 * Operational fields (legal / billing / academic / analytics) are NOT included
 * here — those go to `site_settings` via the dedicated operational loader.
 */
export function buildSiteSetupOverrideMap(
  inputs: SiteSetupOverrideInputs,
): Record<string, string> {
  const { data, logoPath, favPath, faviconBundlePrefix } = inputs;
  const out: Record<string, string> = {
    "app.name": data.appName,
    "app.legal.name": data.legalName,
    "app.tagline": data.tagline,
    "app.logo.alt": data.logoAlt,
    "contact.email": data.contactEmail,
    "contact.phone": data.contactPhone,
    "contact.address": data.contactAddress,
  };
  if (logoPath) out["app.logo.path"] = logoPath;
  if (favPath) out["app.favicon.path"] = favPath;
  if (faviconBundlePrefix) {
    out["app.favicon.bundle.prefix"] = faviconBundlePrefix;
  }
  const tagEn = data.taglineEn?.trim();
  if (tagEn) out["app.tagline.en"] = tagEn;
  if (data.socialFacebook) out["social.facebook"] = data.socialFacebook;
  if (data.socialInstagram) out["social.instagram"] = data.socialInstagram;
  if (data.socialWhatsapp) out["social.whatsapp"] = data.socialWhatsapp;

  // Visual overrides (color/font/layout) live on the theme row.
  if (data.visualPrimary) out["color.primary"] = data.visualPrimary;
  if (data.visualSecondary) out["color.secondary"] = data.visualSecondary;
  if (data.visualAccent) out["color.accent"] = data.visualAccent;
  if (data.visualBackground) out["color.background"] = data.visualBackground;
  if (data.visualSurface) out["color.surface"] = data.visualSurface;
  if (data.fontPrimary) out["font.primary"] = data.fontPrimary;
  if (data.fontSecondary) out["font.secondary"] = data.fontSecondary;
  if (data.fontMono) out["font.mono"] = data.fontMono;
  if (data.layoutMaxWidth) out["layout.max.width"] = data.layoutMaxWidth;
  if (data.layoutBorderRadius) {
    out["layout.border.radius"] = data.layoutBorderRadius;
  }
  return out;
}
