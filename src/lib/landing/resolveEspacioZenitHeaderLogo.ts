import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";

/** Logo bundled con la landing espacio zenit cuando el tema usa el placeholder genérico. */
export function resolveEspacioZenitHeaderLogo(
  brand: BrandPublic,
  mediaMap?: LandingMediaMap,
): string {
  const bundled = resolveLandingImageSrcForTheme(
    "espaciozenit",
    "inicio",
    "1.png",
    mediaMap,
  );
  const lp = brand.logoPath.trim();
  const genericBundledLogo =
    lp === "/images/logo.png" || /(^|\/)images\/logo\.png$/i.test(lp);
  return genericBundledLogo ? bundled : brand.logoPath;
}
