/**
 * Bundled Espacio Zenit gallery (`galeria/`) plus class photos (`horarios/`).
 */
import { EZ_HORARIOS_URLS } from "@/lib/landing/espacioZenitLandingMedia";

const BASE = "/images/espaciozenit/galeria";

function galleryUrl(filename: string): string {
  return encodeURI(`${BASE}/${filename}`);
}

export const EZ_GALLERY_PREVIEW_FILENAMES = [
  "preview-1.jpeg",
  "preview-2.jpeg",
  "preview-3.jpeg",
  "preview-4.jpeg",
] as const;

export const EZ_GALLERY_EXTRA_FILENAMES = [
  "extra-1.jpeg",
  "extra-2.jpeg",
  "extra-3.jpeg",
  "extra-4.jpeg",
  "extra-5.jpeg",
  "extra-6.jpeg",
] as const;

export const EZ_GALLERY_ALL_FILENAMES = [
  ...EZ_GALLERY_PREVIEW_FILENAMES,
  ...EZ_GALLERY_EXTRA_FILENAMES,
] as const;

export const EZ_GALLERY_PREVIEW_URLS: readonly string[] =
  EZ_GALLERY_PREVIEW_FILENAMES.map(galleryUrl);

const EZ_GALLERY_BUNDLED_URLS: readonly string[] =
  EZ_GALLERY_ALL_FILENAMES.map(galleryUrl);

/** Carousel includes galería + former horarios section photos. */
export const EZ_GALLERY_ALL_URLS: readonly string[] = [
  ...EZ_GALLERY_BUNDLED_URLS,
  ...EZ_HORARIOS_URLS,
];
