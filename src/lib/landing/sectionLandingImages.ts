import { LANDING_MEDIA_SLOTS_BY_SECTION } from "@/lib/cms/landingContentCatalog";

/**
 * Bundled landing images for the default site theme under `public/images/golden/<slug>/`.
 * Convention: `1.png`, `2.png`, … (you may switch to `.jpg` if you update the constants).
 */

export type LandingImageSectionSlug =
  | "inicio"
  | "historia"
  | "oferta"
  | "modalidades"
  | "niveles"
  | "certificaciones";

const BASE = "/images/golden";

export function sectionImageSrc(
  section: LandingImageSectionSlug,
  filename: string,
): string {
  return encodeURI(`${BASE}/${section}/${filename}`);
}

/** Cover / hero — `inicio/1.png` … `inicio/3.png` */
export const INICIO_IMAGES = ["1.png", "2.png", "3.png"] as const;

/** Story section — `historia/1.png`, `historia/2.png` */
export const HISTORIA_IMAGES = ["1.png", "2.png"] as const;

const MODALIDADES_SLOT_COUNT = LANDING_MEDIA_SLOTS_BY_SECTION.modalidades;

/** Modalities pool — student gallery + register collage use indices within this list. */
export const MODALIDADES_IMAGES: readonly string[] = Array.from(
  { length: MODALIDADES_SLOT_COUNT },
  (_, i) => `${i + 1}.png`,
);

/** 0-based index over the modalities gallery (same folder). */
export function modalidadesCollageSrc(photoIndex: number): string {
  return sectionImageSrc("modalidades", `${photoIndex + 1}.png`);
}
