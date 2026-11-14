export interface MatissGalleryLabels {
  close: string;
  prev: string;
  next: string;
  position: string;
}

export const MATISS_GALLERY_PAGE_SIZE = 4;

export function formatMatissGalleryPosition(template: string, index: number, total: number): string {
  return template.replaceAll("{current}", String(index + 1)).replaceAll("{total}", String(total));
}

export function stepGalleryIndex(index: number, total: number, delta: number): number {
  if (total <= 1) return 0;
  return (index + delta + total) % total;
}

export function galleryPagePhotos(photos: readonly string[], page: number): string[] {
  const start = page * MATISS_GALLERY_PAGE_SIZE;
  return photos.slice(start, start + MATISS_GALLERY_PAGE_SIZE);
}

export function galleryPageCount(total: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total / MATISS_GALLERY_PAGE_SIZE);
}
