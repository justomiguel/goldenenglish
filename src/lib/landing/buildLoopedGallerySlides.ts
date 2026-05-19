export interface LoopedGallerySlide {
  src: string;
  key: string;
  logicalIndex: number;
}

/**
 * Five copies of the set: the strip can cross from last → first (or back) with a
 * single forward/back step before an invisible snap deep in the buffer copies.
 */
export const LOOP_COPIES = 5;

/** Index of the copy used as the default “home” band (0-based). */
export const MIDDLE_COPY_INDEX = 2;

export function logicalIndexFromTrackOffset(
  trackOffset: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return ((trackOffset % total) + total) % total;
}

export function middleTrackOffset(logicalIndex: number, total: number): number {
  return MIDDLE_COPY_INDEX * total + logicalIndex;
}

export function snapTrackOffsetAfterTransition(
  trackOffset: number,
  total: number,
): number | null {
  if (total <= 1) return null;
  const minSafe = MIDDLE_COPY_INDEX * total;
  const maxSafe = (MIDDLE_COPY_INDEX + 2) * total - 1;
  if (trackOffset > maxSafe) return trackOffset - total;
  if (trackOffset < minSafe) return trackOffset + total;
  return null;
}

export function buildLoopedGallerySlides(
  images: readonly string[],
): LoopedGallerySlide[] {
  const total = images.length;
  if (total <= 1) {
    return images.map((src, i) => ({
      src,
      key: `${src}-${i}`,
      logicalIndex: i,
    }));
  }

  const slides: LoopedGallerySlide[] = [];
  for (let copy = 0; copy < LOOP_COPIES; copy += 1) {
    for (let i = 0; i < total; i += 1) {
      const src = images[i]!;
      slides.push({
        src,
        key: `loop-c${copy}-i${i}-${src}`,
        logicalIndex: i,
      });
    }
  }
  return slides;
}
