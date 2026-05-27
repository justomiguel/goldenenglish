"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MIMUNDO_GALLERY_URLS } from "@/lib/landing/mimundoGalleryImages";
import { MiMundoFloatingDoodles } from "@/components/molecules/MiMundoFloatingDoodles";

/**
 * Decorative washi tape colours + rotation per polaroid slot. Each preview
 * card grabs one of these (round-robin) so the scrapbook look feels handmade.
 */
const GALLERY_WASHI = [
  { color: "var(--mm-pink)",   rotate: "-6deg" },
  { color: "var(--mm-yellow)", rotate: "5deg" },
  { color: "var(--mm-blue)",   rotate: "-3deg" },
] as const;

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
      className="mm-section-cream mm-section-decorated scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
    >
      {/* Watercolor blobs + drifting doodles */}
      <span className="mm-section-blob mm-section-blob--blue"  style={{ inset: "12% auto auto -5%", width: "300px", height: "300px" }} aria-hidden />
      <span className="mm-section-blob mm-section-blob--yellow" style={{ inset: "auto -6% 14% auto", width: "320px", height: "320px" }} aria-hidden />
      <MiMundoFloatingDoodles />
      <div className="flex flex-col items-center text-center">
        <span className="mm-section-label">
          {t("kicker")}
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-mm-display)] text-3xl font-bold text-[var(--mm-green)] md:text-4xl">
          {t("sectionTitle")}
        </h2>
        <svg
          className="mm-scribble-underline mx-auto"
          viewBox="0 0 220 14"
          fill="none"
          aria-hidden
        >
          <path
            d="M 4 8 C 36 2, 64 12, 96 6 S 160 12, 216 4"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
        <p className="mt-3 text-sm text-[var(--mm-ink-deep)] md:text-base">{t("sectionSubtitle")}</p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3 md:gap-8">
        {preview.map((src, i) => {
          const washi = GALLERY_WASHI[i % GALLERY_WASHI.length];
          return (
            <button
              key={src}
              type="button"
              className="mm-frame-polaroid mm-card-bob mm-washi group relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-transparent p-3 pb-10 text-left ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-green)] focus-visible:ring-offset-2"
              style={
                {
                  "--mm-washi-color": washi.color,
                  "--mm-washi-rotate": washi.rotate,
                } as CSSProperties
              }
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
          );
        })}
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
