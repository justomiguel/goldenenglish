import type { LandingImageSectionSlug } from "@/lib/landing/sectionLandingImages";

const BASE = "/images/espaciozenit";

export function espaciozenitSectionImageSrc(
  section: LandingImageSectionSlug,
  filename: string,
): string {
  return encodeURI(`${BASE}/${section}/${filename}`);
}

/** Bundled assets outside CMS section slugs (disciplinas, horarios, galeria, …). */
export function espaciozenitBundledAssetSrc(relativePath: string): string {
  return encodeURI(`${BASE}/${relativePath}`);
}
