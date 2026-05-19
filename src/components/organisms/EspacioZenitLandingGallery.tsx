"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { EZ_GALLERY_ALL_URLS } from "@/lib/landing/espacioZenitGalleryImages";
import {
  EspacioZenitGalleryPreviewRow,
  type EspacioZenitGalleryStripHandle,
} from "@/components/molecules/EspacioZenitGalleryPreviewRow";
import { EspacioZenitGalleryModalControls } from "@/components/molecules/EspacioZenitGalleryModalControls";
import { EspacioZenitGallerySlidePanel } from "@/components/molecules/EspacioZenitGallerySlidePanel";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";

/** Slightly longer than strip CSS transition (~1050ms) so motion finishes before the next step. */
const STRIP_AUTOPLAY_MS = 5800;

export interface EspacioZenitLandingGalleryProps {
  dict: Dictionary;
}

export function EspacioZenitLandingGallery({ dict }: EspacioZenitLandingGalleryProps) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [slideLoading, setSlideLoading] = useState(true);
  const [stripPaused, setStripPaused] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const images = EZ_GALLERY_ALL_URLS;
  const total = images.length;
  const safeTotal = Math.max(total, 1);
  const brand = "ez" as const;
  const t = (key: string) => marketingLandingCopy(dict, brand, `galeria.${key}`);

  const stripRef = useRef<EspacioZenitGalleryStripHandle>(null);

  const stripGoPrev = useCallback(() => stripRef.current?.step(-1), []);
  const stripGoNext = useCallback(() => stripRef.current?.step(1), []);

  const goPrev = useCallback(() => {
    setSlideLoading(true);
    stripGoPrev();
  }, [stripGoPrev]);

  const goNext = useCallback(() => {
    setSlideLoading(true);
    stripGoNext();
  }, [stripGoNext]);

  const advanceStrip = useCallback(() => stripGoNext(), [stripGoNext]);

  const openCarouselAt = useCallback(
    (startIndex: number) => {
      const clamped = Math.max(0, Math.min(startIndex, safeTotal - 1));
      setSlideLoading(true);
      setIndex(clamped);
      stripRef.current?.goToIndex(clamped);
      setOpen(true);
    },
    [safeTotal],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAutoplayEnabled(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (stripPaused || open || safeTotal <= 1 || !autoplayEnabled) return;
    const id = window.setInterval(() => advanceStrip(), STRIP_AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [stripPaused, open, safeTotal, advanceStrip, autoplayEnabled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goPrev, goNext]);

  if (total === 0) return null;

  const positionLabel = t("carouselPosition")
    .replace("{current}", String(index + 1))
    .replace("{total}", String(total));

  return (
    <section
      id="galeria"
      className="scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] bg-black px-[max(1rem,env(safe-area-inset-left))] py-14 lg:px-6"
      aria-labelledby="ez-galeria-heading"
    >
      <div className="mx-auto max-w-6xl">
        <MozarthitosReveal preset="cursosMainStack">
          <h2
            id="ez-galeria-heading"
            className="text-lg font-bold uppercase tracking-[0.22em] text-[var(--ez-cyan)]"
          >
            {t("title")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
            {t("body")}
          </p>

          <div
            className="mt-8"
            onMouseEnter={() => setStripPaused(true)}
            onMouseLeave={() => setStripPaused(false)}
            onKeyDown={(e) => {
              if (open || safeTotal <= 1) return;
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                stripGoPrev();
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                stripGoNext();
              }
            }}
          >
            <div
              className="ez-gallery-strip-shell mx-auto flex max-w-6xl items-center gap-1 sm:gap-2"
              role="group"
              aria-label={t("title")}
            >
              {safeTotal > 1 ? (
                <button
                  type="button"
                  className="ez-gallery-strip-nav shrink-0"
                  onClick={stripGoPrev}
                  aria-label={t("carouselPrev")}
                >
                  <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
                </button>
              ) : (
                <span className="w-11 shrink-0 sm:w-12" aria-hidden />
              )}
              <div className="min-w-0 w-full flex-1">
                <p className="sr-only" aria-live="polite">
                  {positionLabel}
                </p>
                <EspacioZenitGalleryPreviewRow
                  ref={stripRef}
                  images={images}
                  onActiveIndexChange={setIndex}
                  onSelect={(i) => openCarouselAt(i)}
                  previewOpenAria={(n) =>
                    t("previewOpenAria").replace("{n}", String(n))
                  }
                />
              </div>
              {safeTotal > 1 ? (
                <button
                  type="button"
                  className="ez-gallery-strip-nav shrink-0"
                  onClick={stripGoNext}
                  aria-label={t("carouselNext")}
                >
                  <ChevronRight className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
                </button>
              ) : (
                <span className="w-11 shrink-0 sm:w-12" aria-hidden />
              )}
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              type="button"
              className="min-h-[44px] gap-2 rounded-full border border-[rgb(0_174_239_/45%)] bg-[var(--ez-cyan)] px-8 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black shadow-[0_12px_36px_rgb(0_174_239_/28%)] hover:bg-[var(--ez-cyan-soft)]"
              onClick={() => openCarouselAt(index)}
            >
              <Images className="h-4 w-4 shrink-0" aria-hidden />
              {t("verMas")}
            </Button>
          </div>
        </MozarthitosReveal>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        titleId={titleId}
        title={t("title")}
        dialogClassName="max-w-[min(96vw,56rem)] border border-[rgb(0_174_239_/25%)] bg-[#070b12] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <p className="sr-only" aria-live="polite">
            {positionLabel}
          </p>
          <EspacioZenitGallerySlidePanel
            images={images}
            index={index}
            slideLoading={slideLoading}
            setSlideLoading={setSlideLoading}
            loadingLabel={t("carouselLoading")}
            objectClass="object-contain"
            sizes="(max-width:768px) 96vw, 896px"
            frameClass="relative aspect-[4/3] w-full max-h-[min(70dvh,520px)] min-h-[12rem] overflow-hidden rounded-xl border border-[rgb(0_174_239_/20%)] bg-black"
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <EspacioZenitGalleryModalControls
              index={index}
              total={total}
              onPrev={goPrev}
              onNext={goNext}
              prevLabel={t("carouselPrev")}
              nextLabel={t("carouselNext")}
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
