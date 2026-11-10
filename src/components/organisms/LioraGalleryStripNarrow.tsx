"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { LioraGalleryItem } from "@/lib/landing/lioraGalleryImages";

const STEP_MS = 4000;
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduce(onStoreChange: () => void) {
  const media = window.matchMedia(REDUCE_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function reduceSnapshot() {
  return window.matchMedia(REDUCE_QUERY).matches;
}

export interface LioraGalleryStripNarrowProps {
  items: readonly LioraGalleryItem[];
  listLabel: string;
  frameLabel: (index: number) => string;
  positionLabel: (current: number, total: number) => string;
  pauseLabel: string;
  playLabel: string;
  onOpen: (index: number) => void;
}

function itemSrc(item: LioraGalleryItem): string {
  return item.kind === "photo" ? item.src : item.poster;
}

/**
 * Narrow gallery: a native swipe list with snap. The counter follows the
 * scroll position. Autoplay stops at the first touch and stays stopped
 * until the visitor presses play.
 */
export function LioraGalleryStripNarrow({
  items,
  listLabel,
  frameLabel,
  positionLabel,
  pauseLabel,
  playLabel,
  onOpen,
}: LioraGalleryStripNarrowProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduce, reduceSnapshot, () => false);
  const total = items.length;

  const frameWidth = useCallback(() => {
    const list = listRef.current;
    return list && total > 0 ? list.scrollWidth / total : 0;
  }, [total]);

  const onScroll = () => {
    const list = listRef.current;
    const width = frameWidth();
    if (!list || width <= 0) return;
    const next = Math.min(total - 1, Math.max(0, Math.round(list.scrollLeft / width)));
    indexRef.current = next;
    setIndex(next);
  };

  useEffect(() => {
    if (paused || reduced || total < 2) return;
    const timer = window.setInterval(() => {
      const next = (indexRef.current + 1) % total;
      indexRef.current = next;
      setIndex(next);
      listRef.current?.scrollTo?.({ left: frameWidth() * next, behavior: "smooth" });
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduced, total, frameWidth]);

  const stop = () => setPaused(true);

  return (
    <div>
      <ul
        ref={listRef}
        aria-label={listLabel}
        onScroll={onScroll}
        onPointerDown={stop}
        onTouchStart={stop}
        onWheel={stop}
        className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-6 pb-2 [scrollbar-width:none]"
      >
        {items.map((item, itemIndex) => (
          <li key={itemSrc(item)} className="w-[82%] shrink-0 snap-center">
            <button
              type="button"
              className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              aria-label={frameLabel(itemIndex)}
              onClick={() => onOpen(itemIndex)}
            >
              <Image src={itemSrc(item)} alt="" fill className="object-cover" sizes="82vw" />
              {item.kind === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Play className="h-10 w-10 text-white" aria-hidden />
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
          {positionLabel(index + 1, total)}
        </p>
        {total > 1 && !reduced ? (
          <button
            type="button"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--liora-blush)] px-3 text-[var(--liora-rose-text)]"
            aria-label={paused ? playLabel : pauseLabel}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
