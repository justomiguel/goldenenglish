import type { LandingImageSectionSlug } from "@/lib/landing/sectionLandingImages";

const BASE = "/images/mozarthitos";

export function mozarthitosSectionImageSrc(
  section: LandingImageSectionSlug,
  filename: string,
): string {
  if (section === "inicio" && filename === "og.jpg") return `${BASE}/og.jpg`;
  return encodeURI(`${BASE}/${section}/${filename}`);
}
