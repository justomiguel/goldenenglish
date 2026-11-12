"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { MatissPhoto } from "@/variants/owned/matiss/photo/v1/Web";
import { MatissReveal } from "@/variants/owned/matiss/reveal/v1/Web";
import { trackEvent } from "@/lib/analytics/trackClient";
import {
  formatMatissGalleryPosition,
  galleryPageCount,
  galleryPagePhotos,
  stepGalleryIndex,
  type MatissGalleryLabels,
} from "@/lib/landing/matissGalleryCarousel";

export type { MatissGalleryLabels };

export interface LandingMatissGalleryProps {
  title: string;
  alt: string;
  photos: readonly string[];
  labels: MatissGalleryLabels;
  layout?: "mosaic" | "pages";
}

const TILE_SHAPE = ["row-span-2", "", "row-span-2", "", "", "row-span-2", "", ""];

export function LandingMatissGallery({
  title,
  alt,
  photos,
  labels,
  layout = "mosaic",
}: LandingMatissGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<number | null>(null);
  const pages = galleryPageCount(photos.length);
  const visible = layout === "pages" ? galleryPagePhotos(photos, page) : photos;
  const pageStart = layout === "pages" ? page * 4 : 0;
  const open = openIndex !== null ? photos[openIndex] : null;

  function openAt(index: number, trigger: HTMLButtonElement) {
    if (photos.length === 0) return;
    triggerRef.current = trigger;
    setOpenIndex(index);
    trackEvent("click", "gallery:matiss", { index });
  }

  function close() {
    const trigger = triggerRef.current;
    setOpenIndex(null);
    queueMicrotask(() => trigger?.focus());
  }

  function move(delta: number) {
    setOpenIndex((current) => (current === null ? current : stepGalleryIndex(current, photos.length, delta)));
  }

  const wasOpen = useRef(false);

  useEffect(() => {
    if (openIndex !== null && !wasOpen.current) closeRef.current?.focus();
    wasOpen.current = openIndex !== null;
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const trigger = triggerRef.current;
        setOpenIndex(null);
        queueMicrotask(() => trigger?.focus());
      }
      if (event.key === "ArrowRight") {
        setOpenIndex((current) => (current === null ? current : stepGalleryIndex(current, photos.length, 1)));
      }
      if (event.key === "ArrowLeft") {
        setOpenIndex((current) => (current === null ? current : stepGalleryIndex(current, photos.length, -1)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, photos.length]);

  const position = openIndex === null ? "" : formatMatissGalleryPosition(labels.position, openIndex, photos.length);
  const canStep = photos.length > 1;

  const gridClass = layout === "pages"
    ? "mt-8 grid grid-cols-2 gap-3"
    : "matiss-stagger mt-10 grid auto-rows-[10rem] grid-cols-2 gap-3 md:auto-rows-[13rem] md:grid-cols-4 md:gap-4";

  return (
    <MatissReveal preset="steps">
    <section id="galeria" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="matiss-display text-4xl text-[var(--ds-color-foreground)] md:text-5xl">{title}</h2>
        {open && openIndex !== null ? (
          <div role="dialog" aria-modal="true" aria-label={title} className="mt-8">
            <figure
              className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[32px]"
              onPointerDown={(event) => {
                dragRef.current = event.clientX;
              }}
              onPointerUp={(event) => {
                const start = dragRef.current;
                dragRef.current = null;
                if (start === null || !canStep) return;
                const delta = event.clientX - start;
                if (delta <= -40) move(1);
                if (delta >= 40) move(-1);
              }}
            >
              <Image src={open} alt={alt} fill sizes="(min-width: 768px) 28rem, 92vw" className="object-cover" />
            </figure>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--owned-line)] bg-white text-[var(--ds-color-primary)] disabled:bg-[var(--ds-color-muted)] disabled:text-[var(--ds-color-muted-foreground)]" aria-label={labels.prev} disabled={!canStep} onClick={() => move(-1)}>
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <p className="text-sm font-semibold text-[var(--ds-color-foreground)]" aria-live="polite">{position}</p>
              <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--owned-line)] bg-white text-[var(--ds-color-primary)] disabled:bg-[var(--ds-color-muted)] disabled:text-[var(--ds-color-muted-foreground)]" aria-label={labels.next} disabled={!canStep} onClick={() => move(1)}>
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
              <button ref={closeRef} type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--ds-color-primary)] text-white" aria-label={labels.close} onClick={close}>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <>
            <ul className={gridClass}>
              {visible.map((src, local) => {
                const index = pageStart + local;
                return (
                  <li key={`${src}-${index}`} className={layout === "mosaic" ? TILE_SHAPE[index % TILE_SHAPE.length] : ""}>
                    <button type="button" className="block h-full w-full" aria-label={alt} onClick={(event) => openAt(index, event.currentTarget)}>
                      <MatissPhoto
                        src={src}
                        alt=""
                        sizes="(min-width: 768px) 24vw, 46vw"
                        frameClassName={layout === "pages" ? "aspect-[3/4] w-full rounded-3xl" : "matiss-frame--zoom h-full w-full rounded-3xl"}
                        imageClassName="object-[50%_30%]"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            {layout === "pages" && pages > 1 ? (
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--owned-line)] bg-white text-[var(--ds-color-primary)]" aria-label={labels.prev} onClick={() => setPage((current) => stepGalleryIndex(current, pages, -1))}>
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--owned-line)] bg-white text-[var(--ds-color-primary)]" aria-label={labels.next} onClick={() => setPage((current) => stepGalleryIndex(current, pages, 1))}>
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
    </MatissReveal>
  );
}

export default LandingMatissGallery;
