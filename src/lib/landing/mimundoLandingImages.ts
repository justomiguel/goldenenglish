import type { LandingImageSectionSlug } from "@/lib/landing/sectionLandingImages";

const BASE = "/images/mimundo";

/** Cropped from the Mi Mundo logo — decorative butterfly (transparent PNG). */
export const MIMUNDO_DECORATIVE_BUTTERFLY_SRC = `${BASE}/decorative/butterfly.png`;

/** Width ÷ height of `decorative/butterfly.png` (logo crop). */
export const MIMUNDO_DECORATIVE_BUTTERFLY_ASPECT = 164 / 140;

export function mimundoSectionImageSrc(
  section: LandingImageSectionSlug,
  filename: string,
): string {
  return encodeURI(`${BASE}/${section}/${filename}`);
}
