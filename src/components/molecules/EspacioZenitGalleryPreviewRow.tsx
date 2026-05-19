"use client";

import Image from "next/image";
import { forwardRef, useImperativeHandle } from "react";
import {
  useEspacioZenitGalleryStrip,
  type EspacioZenitGalleryStripHandle,
} from "@/hooks/useEspacioZenitGalleryStrip";

export type { EspacioZenitGalleryStripHandle };

const EMPTY_GALLERY_IMAGES: readonly string[] = [];

export interface EspacioZenitGalleryPreviewRowProps {
  images: readonly string[];
  onSelect: (index: number) => void;
  onActiveIndexChange?: (index: number) => void;
  previewOpenAria: (oneBasedIndex: number) => string;
}

export const EspacioZenitGalleryPreviewRow = forwardRef<
  EspacioZenitGalleryStripHandle,
  EspacioZenitGalleryPreviewRowProps
>(function EspacioZenitGalleryPreviewRow(
  { images: imagesProp, onSelect, onActiveIndexChange, previewOpenAria },
  ref,
) {
  const images = imagesProp ?? EMPTY_GALLERY_IMAGES;

  const {
    viewportRef,
    trackRef,
    loopedImages,
    activeIndex,
    translatePx,
    transitionEnabled,
    onTrackTransitionEnd,
    remeasure,
    step,
    goToIndex,
  } = useEspacioZenitGalleryStrip({
    images,
    onActiveIndexChange,
  });

  useImperativeHandle(ref, () => ({ step, goToIndex }), [step, goToIndex]);

  if (imagesProp == null || images.length === 0) {
    return null;
  }

  return (
    <div
      ref={viewportRef}
      className="ez-gallery-strip-viewport relative w-full overflow-x-clip overflow-y-visible py-6 md:py-8"
      aria-roledescription="carousel"
    >
      <ul
        ref={trackRef}
        className={`ez-gallery-strip-track flex w-max items-center gap-3.5 md:gap-4${
          transitionEnabled ? "" : " ez-gallery-strip-track--instant"
        }`}
        style={{ transform: `translate3d(${translatePx}px, 0, 0)` }}
        onTransitionEnd={onTrackTransitionEnd}
      >
        {loopedImages.map(({ src, key, logicalIndex }) => {
          const isActive = logicalIndex === activeIndex;
          return (
            <li
              key={key}
              data-ez-gallery-item
              className={`ez-gallery-strip-item relative w-[9.25rem] shrink-0 md:w-[11.25rem] ${
                isActive ? "is-active z-20" : "z-0"
              }`}
            >
              <button
                type="button"
                className={`relative block aspect-square w-full overflow-hidden rounded-xl border bg-[#070b12] p-0 text-left shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ez-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  isActive
                    ? "border-[var(--ez-cyan)] shadow-[0_0_40px_rgb(0_174_239_/35%)]"
                    : "border-[rgb(0_174_239_/18%)]"
                }`}
                onClick={() => onSelect(logicalIndex)}
                aria-label={previewOpenAria(logicalIndex + 1)}
                aria-current={isActive ? "true" : undefined}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:768px) 148px, 180px"
                  priority={isActive}
                  onLoad={remeasure}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
