/**
 * Public URL helper for bundled Nagô gallery files under `public/images/nago/galeria/`.
 * Event membership and display order live in `nagoGalleryCatalog.ts`.
 */
const BASE = "/images/nago/galeria";

export function nagoGalleryPublicUrl(filename: string): string {
  return encodeURI(`${BASE}/${filename}`);
}
