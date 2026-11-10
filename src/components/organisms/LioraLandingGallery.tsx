"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { LioraSectionHeading } from "@/components/molecules/LioraSectionHeading";
import { LioraGalleryVideoSlide } from "@/components/organisms/LioraGalleryVideoSlide";
import { useLioraGalleryStrip } from "@/hooks/useLioraGalleryStrip";
import { useAppSurface } from "@/hooks/useAppSurface";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { LioraGalleryStripNarrow } from "@/components/organisms/LioraGalleryStripNarrow";
import { LioraGalleryStripDesktop } from "@/components/organisms/LioraGalleryStripDesktop";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import {
  LIORA_GALLERY_ITEMS,
  type LioraGalleryItem,
} from "@/lib/landing/lioraGalleryImages";
import type { Dictionary } from "@/types/i18n";

export interface LioraLandingGalleryProps {
  dict: Dictionary;
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
  // The narrow strip scrolls on its own; the desktop timer only runs on desktop.
  const narrow = useAppSurface() !== "web-desktop";
  const strip = useLioraGalleryStrip(total, open || narrow);
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

  const desktopStrip = (
    <LioraGalleryStripDesktop
      items={items}
      strip={strip}
      position={position}
      frameLabel={(i) => frameLabel(items, i, t)}
      labels={{
        prev: t("carouselPrev"),
        next: t("carouselNext"),
        pause: t("autoplayPause"),
        play: t("autoplayPlay"),
      }}
      onOpen={openAt}
    />
  );

  return (
    <section
      id="galeria"
      className="liora-section liora-band-cream"
      data-liora-anchor="galeria"
      data-liora-side="full"
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <LioraSectionHeading title={t("sectionTitle")} script={t("titleScript")} />
        <div className="mt-10">
          <SurfaceMountGate
            skeleton={desktopStrip}
            desktop={desktopStrip}
            narrow={() => (
              <LioraGalleryStripNarrow
                items={items}
                listLabel={t("sectionTitle")}
                frameLabel={(i) => frameLabel(items, i, t)}
                positionLabel={(current, all) =>
                  t("carouselPosition").replace("{current}", String(current)).replace("{total}", String(all))
                }
                pauseLabel={t("autoplayPause")}
                playLabel={t("autoplayPlay")}
                onOpen={openAt}
              />
            )}
          />
        </div>
        <button
          type="button"
          className="liora-btn-outline mt-8 inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-xs font-medium uppercase tracking-[0.2em]"
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
