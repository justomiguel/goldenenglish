import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

export const GENERIC_PHOTO_SECTIONS = [
  "inicio",
  "historia",
  "oferta",
  "modalidades",
  "niveles",
  "certificaciones",
] as const;

export type GenericPhotoSection = (typeof GENERIC_PHOTO_SECTIONS)[number];

/**
 * Photos the owner uploaded. The designed template stays in place until then.
 * `kind` is unused here and kept so callers stay stable.
 */
export function genericSectionPhotos(
  _kind: GenericInstituteKind,
  media?: LandingMediaMap,
): Partial<Record<GenericPhotoSection, string>> {
  const photos: Partial<Record<GenericPhotoSection, string>> = {};
  if (!media) return photos;
  for (const section of GENERIC_PHOTO_SECTIONS) {
    const uploaded = media.get(`${section}::1`);
    if (uploaded) photos[section] = uploaded;
  }
  return photos;
}
