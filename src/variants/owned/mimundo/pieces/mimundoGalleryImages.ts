/**
 * Mi Mundo marketing gallery images under `public/images/mimundo/galeria/`.
 * Append new filenames here in display order.
 */
const BASE = "/images/mimundo/galeria";

export const MIMUNDO_GALLERY_FILENAMES = [
  "galeria-1.jpg",
  "galeria-2.jpg",
  "galeria-3.jpg",
  "galeria-4.jpg",
  "galeria-5.jpg",
  "galeria-6.jpg",
  "galeria-7.jpg",
  "galeria-8.jpg",
] as const;

export function mimundoGalleryPublicUrl(filename: string): string {
  return encodeURI(`${BASE}/${filename}`);
}

export const MIMUNDO_GALLERY_URLS: readonly string[] =
  MIMUNDO_GALLERY_FILENAMES.map(mimundoGalleryPublicUrl);
