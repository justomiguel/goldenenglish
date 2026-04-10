/**
 * Imágenes por sección en `public/images/sections/<slug>/`.
 * Convención: `1.png`, `2.png`, … (podés usar .jpg si actualizás las constantes).
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

/** Portada / hero — `inicio/1.png` … `inicio/3.png` */
export const INICIO_IMAGES = ["1.png", "2.png", "3.png"] as const;

/** Nuestra historia — `historia/1.png`, `historia/2.png` */
export const HISTORIA_IMAGES = ["1.png", "2.png"] as const;

/** Modalidades (collage + galería alumnos) — `modalidades/1.png` … `4.png` */
export const MODALIDADES_IMAGES = ["1.png", "2.png", "3.png", "4.png"] as const;

/** Índice 0-based sobre la galería modalidades (mismo folder). */
export function modalidadesCollageSrc(photoIndex: number): string {
  return sectionImageSrc("modalidades", `${photoIndex + 1}.png`);
}
