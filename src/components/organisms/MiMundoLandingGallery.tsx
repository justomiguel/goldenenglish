"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MIMUNDO_GALLERY_URLS } from "@/lib/landing/mimundoGalleryImages";

export interface MiMundoLandingGalleryProps {
  dict: Dictionary;
}

export function MiMundoLandingGallery({ dict }: MiMundoLandingGalleryProps) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [slideLoading, setSlideLoading] = useState(true);
  const images = MIMUNDO_GALLERY_URLS;
  const total = images.length;
  const safeTotal = Math.max(total, 1);
  const preview = images.slice(0, 3);

  const t = (key: string) => marketingLandingCopy(dict, "mm", `galeria.${key}`);

  const goPrev = useCallback(() => {
    setSlideLoading(true);
    setIndex((i) => (i - 1 + safeTotal) % safeTotal);
  }, [safeTotal]);

  const goNext = useCallback(() => {
    setSlideLoading(true);
    setIndex((i) => (i + 1) % safeTotal);
  }, [safeTotal]);

  const openCarouselAt = (startIndex: number) => {
    const clamped = Math.max(0, Math.min(startIndex, safeTotal - 1));
    setSlideLoading(true);
    setIndex(clamped);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
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
      className="mm-section-cream scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
    >
      <h2 className="text-center font-[family-name:var(--font-mm-display)] text-3xl font-bold text-[var(--mm-green)] md:text-4xl">
        {t("sectionTitle")}
      </h2>
      <p className="mt-3 text-center text-sm text-[var(--mm-ink)]/70 md:text-base">{t("sectionSubtitle")}</p>
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3 md:gap-8">
        {preview.map((src, i) => (
          <button
            key={src}
            type="button"
            className="mm-frame-polaroid group relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-transparent p-3 pb-10 text-left ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-green)] focus-visible:ring-offset-2"
            onClick={() => openCarouselAt(i)}
            aria-label={t("previewOpenAria").replace("{n}", String(i + 1))}
          >
            <Image
              src={src}
              alt=""
              width={400}
              height={300}
              className="h-full w-full rounded-sm object-cover"
              sizes="(max-width:640px) 100vw, 33vw"
              priority={i === 0}
            />
          </button>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px] gap-2 rounded-full bg-[var(--mm-green)] px-8 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[var(--mm-green-dark)]"
          onClick={() => openCarouselAt(0)}
        >
          <Images className="h-4 w-4 shrink-0" aria-hidden />
          {t("verMas")}
        </Button>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        titleId={titleId}
        title={t("sectionTitle")}
        dialogClassName="max-w-[min(96vw,56rem)] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <p id={`${titleId}-status`} className="sr-only" aria-live="polite">{positionLabel}</p>
          <div
            className="relative aspect-[4/3] max-h-[min(70dvh,520px)] min-h-[12rem] w-full overflow-hidden rounded-lg bg-black/5"
            aria-busy={slideLoading}
          >
            {slideLoading ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[color-mix(in_srgb,var(--color-muted)_55%,transparent)]" role="status" aria-live="polite">
                <Loader2 className="h-10 w-10 shrink-0 animate-spin text-[var(--mm-green)]" aria-hidden strokeWidth={2} />
                <span className="sr-only">{t("carouselLoading")}</span>
              </div>
            ) : null}
            <Image
              key={images[index]}
              src={images[index]}
              alt=""
              fill
              className={`object-contain transition-opacity duration-300 ease-out ${slideLoading ? "opacity-0" : "opacity-100"}`}
              sizes="(max-width:768px) 96vw, 896px"
              onLoad={() => setSlideLoading(false)}
              onError={() => setSlideLoading(false)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="secondary" size="sm"
              className="min-h-[44px] gap-2 border-[var(--color-border)]"
              onClick={goPrev} aria-label={t("carouselPrev")}>
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{t("carouselPrev")}</span>
            </Button>
            <span className="min-w-[4.5rem] text-center text-sm font-medium text-[var(--color-foreground)]/80" aria-hidden>
              {index + 1} / {total}
            </span>
            <Button type="button" variant="secondary" size="sm"
              className="min-h-[44px] gap-2 border-[var(--color-border)]"
              onClick={goNext} aria-label={t("carouselNext")}>
              <span className="hidden sm:inline">{t("carouselNext")}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
