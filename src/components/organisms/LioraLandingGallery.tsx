"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, Loader2, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { LioraGalleryVideoSlide } from "@/components/organisms/LioraGalleryVideoSlide";
import { useLioraGalleryStrip } from "@/hooks/useLioraGalleryStrip";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import {
  LIORA_GALLERY_ITEMS,
  type LioraGalleryItem,
} from "@/lib/landing/lioraGalleryImages";
import type { Dictionary } from "@/types/i18n";

export interface LioraLandingGalleryProps {
  dict: Dictionary;
}

function itemSrc(item: LioraGalleryItem): string {
  return item.kind === "photo" ? item.src : item.poster;
}

function frameLabel(
  items: readonly LioraGalleryItem[],
  itemIndex: number,
  label: (path: string) => string,
): string {
  const item = items[itemIndex];
  const seen = items.slice(0, itemIndex + 1).filter((entry) => entry.kind === item?.kind).length;
  const key = item?.kind === "video" ? "previewPlayAria" : "previewOpenAria";
  return label(key).replace("{n}", String(seen));
}

export function LioraLandingGallery({ dict }: LioraLandingGalleryProps) {
  const titleId = useId();
  const t = (path: string) => marketingLandingCopy(dict, "liora", `galeria.${path}`);
  const items = LIORA_GALLERY_ITEMS;
  const total = items.length;
  const [open, setOpen] = useState(false);
  const [slideLoading, setSlideLoading] = useState(true);
  const strip = useLioraGalleryStrip(total, open);
  const markReady = useCallback(() => setSlideLoading(false), []);

  const openAt = (next: number) => {
    strip.goTo(next);
    setSlideLoading(true);
    setOpen(true);
  };

  const move = (delta: number) => {
    setSlideLoading(true);
    strip.step(delta);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSlideLoading(true);
        strip.step(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSlideLoading(true);
        strip.step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, strip.step]);

  const current = items[strip.index];
  const position = t("carouselPosition")
    .replace("{current}", String(strip.index + 1))
    .replace("{total}", String(total));

  return (
    <section
      id="galeria"
      className="liora-section-pad bg-[var(--color-background)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
          {t("kicker")}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-medium text-[var(--color-foreground)] md:text-4xl">
          {t("sectionTitle")}
        </h2>
        <div
          className="mt-8"
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
                  aria-label={frameLabel(items, itemIndex, t)}
                  onClick={() => openAt(itemIndex)}
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-foreground)]"
                aria-label={t("carouselPrev")}
                onClick={() => strip.step(-1)}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--color-muted)] px-3 text-[var(--color-foreground)]"
                aria-label={strip.paused ? t("autoplayPlay") : t("autoplayPause")}
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-foreground)]"
                aria-label={t("carouselNext")}
                onClick={() => strip.step(1)}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]"
          onClick={() => openAt(0)}
        >
          <Images className="h-4 w-4" aria-hidden />
          {t("verMas")}
        </button>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        titleId={titleId}
        title={t("sectionTitle")}
        dialogClassName="max-w-[min(96vw,56rem)] bg-black p-3 text-white sm:max-w-3xl sm:p-4 md:max-w-4xl lg:max-w-5xl"
      >
        <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
          {current?.kind === "photo" ? (
            <Image
              key={current.src}
              src={current.src}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
              onLoad={markReady}
              onError={markReady}
            />
          ) : null}
          {current?.kind === "video" ? (
            <LioraGalleryVideoSlide
              key={current.src}
              src={current.src}
              poster={current.poster}
              playLabel={t("play")}
              pauseLabel={t("pause")}
              active={open}
              onReady={markReady}
            />
          ) : null}
          {slideLoading ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/45"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <Loader2 className="h-8 w-8 animate-spin text-white motion-reduce:animate-none" aria-hidden />
              <span className="sr-only">{t("carouselLoading")}</span>
            </div>
          ) : null}
          <button
            type="button"
            className="absolute start-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
            aria-label={t("carouselPrev")}
            onClick={() => move(-1)}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            className="absolute end-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
            aria-label={t("carouselNext")}
            onClick={() => move(1)}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-3 text-center text-sm text-white/80">{position}</p>
      </Modal>
    </section>
  );
}
