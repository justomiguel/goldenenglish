import type { LandingImageSectionSlug } from "@/lib/landing/sectionLandingImages";

const BASE = "/images/mozarthitos";

export function mozarthitosSectionImageSrc(
  section: LandingImageSectionSlug,
  filename: string,
): string {
  return encodeURI(`${BASE}/${section}/${filename}`);
}
