/**
 * Section images under `public/images/sections/<slug>/`.
 * Convention: `1.png`, `2.png`, … (you may switch to `.jpg` if you update the constants).
 */

export type LandingImageSectionSlug =
  | "inicio"
  | "historia"
  | "oferta"
  | "modalidades"
  | "niveles"
  | "certificaciones";

const BASE = "/images/sections";

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

/** Modalities (collage + student gallery) — `modalidades/1.png` … `4.png` */
export const MODALIDADES_IMAGES = ["1.png", "2.png", "3.png", "4.png"] as const;

/** 0-based index over the modalities gallery (same folder). */
export function modalidadesCollageSrc(photoIndex: number): string {
  return sectionImageSrc("modalidades", `${photoIndex + 1}.png`);
}
