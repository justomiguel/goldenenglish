"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, Loader2, Play } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { LioraGalleryVideoSlide } from "@/components/organisms/LioraGalleryVideoSlide";
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

export function LioraLandingGallery({ dict }: LioraLandingGalleryProps) {
  const titleId = useId();
  const t = (path: string) => marketingLandingCopy(dict, "liora", `galeria.${path}`);
  const items = LIORA_GALLERY_ITEMS;
  const total = items.length;
  const videoIndex = items.findIndex((item) => item.kind === "video");
  const preview = [
    { item: items[0], openAt: 0, label: t("previewOpenAria").replace("{n}", "1") },
    { item: items[1], openAt: 1, label: t("previewOpenAria").replace("{n}", "2") },
    {
      item: items[videoIndex],
      openAt: videoIndex,
      label: t("previewPlayAria").replace("{n}", "1"),
    },
  ];
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [slideLoading, setSlideLoading] = useState(true);
  const markReady = useCallback(() => setSlideLoading(false), []);

  const openAt = (next: number) => {
    setIndex(next);
    setSlideLoading(true);
    setOpen(true);
  };

  const step = useCallback(
    (delta: number) => {
      setSlideLoading(true);
      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  const current = items[index];

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
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {preview.map((frame) =>
            frame.item ? (
              <button
                key={frame.openAt}
                type="button"
                className="group relative aspect-[3/4] min-h-11 overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                aria-label={frame.label}
                onClick={() => openAt(frame.openAt)}
              >
                <Image
                  src={itemSrc(frame.item)}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                {frame.item.kind === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="h-10 w-10 text-white" aria-hidden />
                  </span>
                ) : null}
              </button>
            ) : null,
          )}
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
            onClick={() => step(-1)}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            className="absolute end-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white"
            aria-label={t("carouselNext")}
            onClick={() => step(1)}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-3 text-center text-sm text-white/80">
          {t("carouselPosition")
            .replace("{current}", String(index + 1))
            .replace("{total}", String(total))}
        </p>
      </Modal>
    </section>
  );
}
