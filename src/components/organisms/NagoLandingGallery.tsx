"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_TEMPLATE_GALLERY_URLS } from "@/lib/landing/nagoTemplateImages";
import { NagoReveal } from "@/components/organisms/NagoReveal";
import { useNagoSound } from "@/components/organisms/NagoSoundRoot";

export interface NagoLandingGalleryProps {
  dict: Dictionary;
}

export function NagoLandingGallery({ dict }: NagoLandingGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const images = NAGO_TEMPLATE_GALLERY_URLS;
  const total = images.length;
  const { playSignature } = useNagoSound();
  const t = (key: string) => marketingLandingCopy(dict, "nago", `galeria.${key}`);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const openAt = (start: number) => {
    setIndex(start);
    setOpen(true);
    playSignature();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
      className="nago-section scroll-mt-24 px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]"
    >
      <NagoReveal>
        <h2 className="nago-display text-center text-4xl text-[var(--nago-heading-solid)] md:text-5xl">
          {t("sectionTitle")}
        </h2>
      </NagoReveal>
      <div className="nago-masonry mx-auto mt-10 max-w-7xl">
        {images.map((src, i) => (
          <div key={src} className="nago-masonry-item">
            <button
              type="button"
              className="relative block w-full overflow-hidden border-0 bg-transparent p-0"
              onClick={() => openAt(i)}
              aria-label={t("previewOpenAria").replace("{n}", String(i + 1))}
            >
              <Image
                src={src}
                alt=""
                width={i % 2 === 0 ? 720 : 560}
                height={i % 2 === 0 ? 960 : 420}
                className="h-auto w-full object-cover"
                sizes="(max-width:640px) 100vw, 33vw"
              />
            </button>
          </div>
        ))}
      </div>

      {open ? (
        <div
          className="nago-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t("sectionTitle")}
        >
          <p className="sr-only" aria-live="polite">
            {positionLabel}
          </p>
          <button
            type="button"
            className="absolute right-4 top-4 nago-btn px-3 py-2 text-xs"
            onClick={() => setOpen(false)}
          >
            {t("lightboxClose")}
          </button>
          <div className="relative flex w-full max-w-5xl items-center gap-3">
            <button
              type="button"
              className="nago-btn shrink-0 px-3"
              onClick={goPrev}
              aria-label={t("carouselPrev")}
            >
              ←
            </button>
            <div className="relative aspect-[4/3] min-h-[40vh] w-full">
              <Image
                key={images[index]}
                src={images[index]}
                alt=""
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
            <button
              type="button"
              className="nago-btn shrink-0 px-3"
              onClick={goNext}
              aria-label={t("carouselNext")}
            >
              →
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
