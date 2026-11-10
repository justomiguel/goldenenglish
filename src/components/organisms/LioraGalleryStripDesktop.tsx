"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { useLioraGalleryStrip } from "@/hooks/useLioraGalleryStrip";
import type { LioraGalleryItem } from "@/lib/landing/lioraGalleryImages";

export interface LioraGalleryStripDesktopProps {
  items: readonly LioraGalleryItem[];
  strip: ReturnType<typeof useLioraGalleryStrip>;
  position: string;
  frameLabel: (index: number) => string;
  labels: { prev: string; next: string; pause: string; play: string };
  onOpen: (index: number) => void;
}

function itemSrc(item: LioraGalleryItem): string {
  return item.kind === "photo" ? item.src : item.poster;
}

/** Desktop gallery: a transform strip with arrows and a pause button. */
export function LioraGalleryStripDesktop({
  items,
  strip,
  position,
  frameLabel,
  labels,
  onOpen,
}: LioraGalleryStripDesktopProps) {
  return (
    <div
      onMouseEnter={strip.onMouseEnter}
      onMouseLeave={strip.onMouseLeave}
      onFocus={strip.onFocus}
      onBlur={strip.onBlur}
    >
      <div className="liora-gallery-viewport">
        <div
          className="liora-gallery-track"
          data-gallery-start={strip.index}
          style={{ ["--liora-gallery-index" as string]: String(strip.index) }}
        >
          {items.map((item, itemIndex) => (
            <button
              key={itemSrc(item)}
              type="button"
              className="liora-gallery-frame group relative aspect-[3/4] min-h-11 overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              aria-label={frameLabel(itemIndex)}
              onClick={() => onOpen(itemIndex)}
            >
              <Image
                src={itemSrc(item)}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 88vw, 30vw"
              />
              {item.kind === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Play className="h-10 w-10 text-white" aria-hidden />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">{position}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--liora-blush)] text-[var(--liora-rose-text)] transition-colors hover:bg-[var(--liora-line)]"
            aria-label={labels.prev}
            onClick={() => strip.step(-1)}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--liora-blush)] px-3 text-[var(--liora-rose-text)] transition-colors hover:bg-[var(--liora-line)]"
            aria-label={strip.paused ? labels.play : labels.pause}
            aria-pressed={strip.paused}
            onClick={() => strip.setPaused((value) => !value)}
          >
            {strip.paused ? (
              <Play className="h-4 w-4" aria-hidden />
            ) : (
              <Pause className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--liora-blush)] text-[var(--liora-rose-text)] transition-colors hover:bg-[var(--liora-line)]"
            aria-label={labels.next}
            onClick={() => strip.step(1)}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
