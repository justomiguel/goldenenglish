/**
 * Bundled Liora Studio gallery under `public/images/liora/galeria/`.
 * When you add files to that folder, append the filename here in display order.
 */
const BASE = "/images/liora/galeria";

export const LIORA_GALLERY_FILENAMES = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "6.jpg",
] as const;

export function lioraGalleryPublicUrl(filename: string): string {
  return encodeURI(`${BASE}/${filename}`);
}

export const LIORA_GALLERY_URLS: readonly string[] =
  LIORA_GALLERY_FILENAMES.map(lioraGalleryPublicUrl);
