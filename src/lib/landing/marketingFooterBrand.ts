import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import type { SiteThemeKind } from "@/types/theming";

/** Footer copy brand for a full-bleed landing. Missing kinds keep the shell footer. */
export const MARKETING_FOOTER_BRAND: Partial<Record<SiteThemeKind, MarketingLandingBrand>> = {
  mozarthitos: "mz",
  espaciozenit: "ez",
  nago: "nago",
  mimundo: "mm",
  liora: "liora",
  matiss: "matiss",
};
