import type { LandingImageSectionSlug } from "@/lib/landing/sectionLandingImages";

const BASE = "/images/liora";

export function lioraSectionImageSrc(
  section: LandingImageSectionSlug,
  filename: string,
): string {
  return encodeURI(`${BASE}/${section}/${filename}`);
}
