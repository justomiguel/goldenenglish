/**
 * Bundled Nago marketing gallery under `public/images/nago/galeria/`.
 * When you add files to that folder, append the filename here in display order.
 */
const BASE = "/images/nago/galeria";

export const NAGO_GALLERY_FILENAMES = [
  "Screenshot 2026-05-09 at 11.45.45.png",
  "Screenshot 2026-05-09 at 11.45.57.png",
  "Screenshot 2026-05-09 at 11.46.06.png",
] as const;

export function nagoGalleryPublicUrl(filename: string): string {
  return encodeURI(`${BASE}/${filename}`);
}

export const NAGO_GALLERY_URLS: readonly string[] =
  NAGO_GALLERY_FILENAMES.map(nagoGalleryPublicUrl);
