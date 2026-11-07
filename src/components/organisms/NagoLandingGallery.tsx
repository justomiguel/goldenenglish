"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import {
  NAGO_GALLERY_EVENT_COPY,
  nagoGalleryImagesFor,
  nagoGalleryVideosFor,
  type NagoGalleryEventId,
} from "@/lib/landing/nagoGalleryCatalog";
import { NagoGalleryEventGroups } from "@/components/organisms/NagoGalleryEventGroups";
import { NagoGalleryLightbox } from "@/components/organisms/NagoGalleryLightbox";
import { NagoReveal } from "@/components/organisms/NagoReveal";
import { useNagoSound } from "@/components/organisms/NagoSoundRoot";

export interface NagoLandingGalleryProps {
  dict: Dictionary;
}

type GalleryLane = "image" | "video";

export function NagoLandingGallery({ dict }: NagoLandingGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [lane, setLane] = useState<GalleryLane>("image");
  const [eventId, setEventId] = useState<NagoGalleryEventId | null>(null);
  const photos = eventId ? nagoGalleryImagesFor(eventId) : [];
  const videos = eventId ? nagoGalleryVideosFor(eventId) : [];
  const laneItems = lane === "video" ? videos : photos;
  const total = laneItems.length;
  const { playSignature } = useNagoSound();
  const t = (key: string) => marketingLandingCopy(dict, "nago", `galeria.${key}`);

  const openMedia = (nextEvent: NagoGalleryEventId, nextLane: GalleryLane, start: number) => {
    setEventId(nextEvent);
    setLane(nextLane);
    setIndex(start);
    setOpen(true);
    playSignature();
  };

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

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

  const current = laneItems[index];
  const positionLabel = t("mediaPosition")
    .replace("{current}", String(index + 1))
    .replace("{total}", String(total));
  const photoLabel = (i: number) => t("previewOpenAria").replace("{n}", String(i + 1));
  const videoLabel = (i: number) => t("previewOpenVideoAria").replace("{n}", String(i + 1));

  return (
    <section
      id="galeria"
      className="nago-section scroll-mt-24 px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]"
    >
      <NagoReveal variant="mask">
        <h2 className="nago-display text-center text-4xl text-[var(--nago-heading-solid)] md:text-5xl">
          {t("sectionTitle")}
        </h2>
      </NagoReveal>
      <NagoGalleryEventGroups
        eventName={(id) => t(NAGO_GALLERY_EVENT_COPY[id])}
        videosLabel={t("videosHeading")}
        playLabel={t("playVideo")}
        photoLabel={photoLabel}
        videoLabel={videoLabel}
        onOpenPhoto={(id, i) => openMedia(id, "image", i)}
        onOpenVideo={(id, i) => openMedia(id, "video", i)}
      />
      {open && current ? (
        <NagoGalleryLightbox
          item={current}
          title={t("sectionTitle")}
          positionLabel={positionLabel}
          kindLabel={t(current.kind === "video" ? "kindVideo" : "kindPhoto")}
          closeLabel={t("lightboxClose")}
          prevLabel={t("carouselPrev")}
          nextLabel={t("carouselNext")}
          playLabel={t("playVideo")}
          pauseLabel={t("pauseVideo")}
          seekLabel={t("seekVideo")}
          onClose={() => setOpen(false)}
          onPrev={goPrev}
          onNext={goNext}
        />
      ) : null}
    </section>
  );
}
