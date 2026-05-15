import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";

const NEUTRAL_LOGO = "/file.svg";
const NEUTRAL_FAV = "/file.svg";

/**
 * Public shell copy while `initial_site_setup` is incomplete — avoids showing
 * seeded institute defaults from `SYSTEM_PROPERTIES_DEFAULTS` (repo template identity).
 */
export function neutralBrandForGreenfield(dict: Dictionary): BrandPublic {
  const g = dict.greenfieldPublic;
  return {
    name: g.appName,
    legalName: g.legalName,
    tagline: g.tagline,
    taglineEn: g.taglineEn,
    legalRegistry: "",
    logoPath: resolveBrandAssetUrl(NEUTRAL_LOGO, NEUTRAL_LOGO),
    logoAlt: g.logoAlt,
    faviconPath: resolveBrandAssetUrl(NEUTRAL_FAV, NEUTRAL_FAV),
    faviconBundlePrefix: null,
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    socialFacebook: "",
    socialInstagram: "",
    socialWhatsapp: "",
  };
}
