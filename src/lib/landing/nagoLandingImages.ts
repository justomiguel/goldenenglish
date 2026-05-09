import type { LandingImageSectionSlug } from "@/lib/landing/sectionLandingImages";

const BASE = "/images/nago";

export function nagoSectionImageSrc(
  section: LandingImageSectionSlug,
  filename: string,
): string {
  return encodeURI(`${BASE}/${section}/${filename}`);
}
