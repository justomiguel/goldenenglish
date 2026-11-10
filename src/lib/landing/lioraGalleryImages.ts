/**
 * Bundled Liora Studio gallery under `public/images/liora/galeria/`.
 * Photos come first. Videos follow, each with a poster still.
 */
const BASE = "/images/liora/galeria";

export function lioraGalleryPublicUrl(filename: string): string {
  return encodeURI(`${BASE}/${filename}`);
}

export interface LioraGalleryPhoto {
  kind: "photo";
  src: string;
}

export interface LioraGalleryVideo {
  kind: "video";
  src: string;
  poster: string;
}

export type LioraGalleryItem = LioraGalleryPhoto | LioraGalleryVideo;

const PHOTO_COUNT = 15;
const VIDEO_COUNT = 6;

function photoItem(index: number): LioraGalleryPhoto {
  return { kind: "photo", src: lioraGalleryPublicUrl(`${index}.jpg`) };
}

function videoItem(index: number): LioraGalleryVideo {
  return {
    kind: "video",
    src: lioraGalleryPublicUrl(`v${index}.mp4`),
    poster: lioraGalleryPublicUrl(`v${index}.jpg`),
  };
}

export const LIORA_GALLERY_ITEMS: readonly LioraGalleryItem[] = [
  ...Array.from({ length: PHOTO_COUNT }, (_, index) => photoItem(index + 1)),
  ...Array.from({ length: VIDEO_COUNT }, (_, index) => videoItem(index + 1)),
];
