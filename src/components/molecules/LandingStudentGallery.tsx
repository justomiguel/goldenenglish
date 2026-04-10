"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import {
  MODALIDADES_IMAGES,
  modalidadesCollageSrc,
} from "@/lib/landing/sectionLandingImages";

const stroke = 1.75;

function srcForPhotoIndex(ix: number): string {
  const max = MODALIDADES_IMAGES.length;
  return ix >= 0 && ix < max ? modalidadesCollageSrc(ix) : "";
}

interface LandingStudentGalleryProps {
  dict: Dictionary;
}

export function LandingStudentGallery({ dict }: LandingStudentGalleryProps) {
  const sg = dict.landing.studentGallery;
  const photoAlts = dict.landing.collage.alts;
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpenIdx(null), []);

  const active =
    openIdx !== null ? (sg.items[openIdx] ?? null) : null;
  const slides = active?.photoIndexes ?? [];
  const slideCount = slides.length;
  const currentPhotoIx = slideCount > 0 ? slides[slide % slideCount]! : 0;

  useEffect(() => {
    if (openIdx === null) return;
    const indexes = sg.items[openIdx]?.photoIndexes ?? [];
    const n = indexes.length;

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (n <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlide((s) => (s - 1 + n) % n);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSlide((s) => (s + 1) % n);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [openIdx, close, sg.items]);

  function openCard(idx: number) {
    setSlide(0);
    setOpenIdx(idx);
  }

  function step(delta: number) {
    if (slideCount <= 1) return;
    setSlide((s) => (s + delta + slideCount) % slideCount);
  }

  return (
    <div className="mt-14 border-t border-[var(--color-border)] pt-12">
      <h3 className="font-display text-center text-xl font-semibold text-[var(--color-primary)] md:text-2xl">
        {sg.title}
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
        {sg.intro}
      </p>

      <ul className="mx-auto mt-10 grid max-w-3xl list-none gap-6 sm:grid-cols-2">
        {sg.items.map((item, idx) => {
          const cover = item.coverIndex;
          const label = `${item.name} — ${sg.viewPhotos}`;
          return (
            <li key={`${item.name}-${cover}`}>
              <button
                type="button"
                aria-label={label}
                onClick={() => openCard(idx)}
                className="group relative w-full overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-[var(--shadow-soft)] ring-1 ring-[var(--color-primary)]/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={srcForPhotoIndex(cover)}
                    alt={photoAlts[cover] ?? ""}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-primary-dark)]/75 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white">
                    <span className="font-display text-base font-semibold leading-snug drop-shadow md:text-lg">
                      {item.name}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-accent)]/95 px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-foreground)]">
                      <Images className="h-3.5 w-3.5" aria-hidden strokeWidth={stroke} />
                      {sg.viewPhotos}
                    </span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {active && openIdx !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-6"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-gallery-dialog-title"
            className="relative flex max-h-[100dvh] w-full max-w-4xl flex-col rounded-t-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl sm:max-h-[90vh] sm:rounded-[var(--layout-border-radius)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 md:px-5">
              <h4
                id="student-gallery-dialog-title"
                className="font-display pr-2 text-lg font-semibold text-[var(--color-primary)] md:text-xl"
              >
                {active.name}
              </h4>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="rounded-[var(--layout-border-radius)] p-2 text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                aria-label={sg.close}
              >
                <X className="h-5 w-5" aria-hidden strokeWidth={stroke} />
              </button>
            </div>

            <div className="flex flex-1 items-center gap-1 px-2 py-4 md:px-4 md:py-6">
              {slideCount > 1 ? (
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="shrink-0 rounded-full p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  aria-label={sg.previous}
                >
                  <ChevronLeft className="h-8 w-8" aria-hidden strokeWidth={stroke} />
                </button>
              ) : (
                <div className="w-10 shrink-0" aria-hidden />
              )}

              <div className="relative min-h-0 w-full flex-1">
                <div className="relative mx-auto aspect-[4/3] w-full max-h-[min(60vh,520px)] max-w-3xl overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]">
                  <Image
                    src={srcForPhotoIndex(currentPhotoIx)}
                    alt={photoAlts[currentPhotoIx] ?? ""}
                    fill
                    className="object-contain bg-black/5"
                    sizes="(max-width: 1024px) 100vw, 896px"
                  />
                </div>
                {slideCount > 1 ? (
                  <p className="mt-2 text-center text-sm text-[var(--color-muted-foreground)]">
                    {slide + 1} / {slideCount}
                  </p>
                ) : null}
              </div>

              {slideCount > 1 ? (
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="shrink-0 rounded-full p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  aria-label={sg.next}
                >
                  <ChevronRight className="h-8 w-8" aria-hidden strokeWidth={stroke} />
                </button>
              ) : (
                <div className="w-10 shrink-0" aria-hidden />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
