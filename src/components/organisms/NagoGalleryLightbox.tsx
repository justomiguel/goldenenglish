import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NagoGalleryItem } from "@/lib/landing/nagoGalleryCatalog";
import { NagoGalleryVideoPlayer } from "@/components/organisms/NagoGalleryVideoPlayer";

export function NagoGalleryLightbox({
  item,
  title,
  positionLabel,
  kindLabel,
  closeLabel,
  prevLabel,
  nextLabel,
  playLabel,
  pauseLabel,
  seekLabel,
  onClose,
  onPrev,
  onNext,
}: {
  item: NagoGalleryItem;
  title: string;
  positionLabel: string;
  kindLabel: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
  playLabel: string;
  pauseLabel: string;
  seekLabel: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="nago-lightbox" role="dialog" aria-modal="true" aria-label={title}>
      <p className="sr-only" aria-live="polite">
        {positionLabel}
      </p>
      <p className="absolute left-4 top-4 text-sm font-semibold text-white">{kindLabel}</p>
      <button
        type="button"
        className="nago-btn absolute right-4 top-4 min-h-[44px] px-3 py-2 text-xs"
        onClick={onClose}
      >
        {closeLabel}
      </button>
      <button
        type="button"
        className="nago-btn absolute start-4 top-1/2 min-h-[44px] -translate-y-1/2 px-3"
        onClick={onPrev}
        aria-label={prevLabel}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        className="nago-btn absolute end-4 top-1/2 min-h-[44px] -translate-y-1/2 px-3"
        onClick={onNext}
        aria-label={nextLabel}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
      {item.kind === "video" ? (
        <NagoGalleryVideoPlayer
          key={item.src}
          item={item}
          playLabel={playLabel}
          pauseLabel={pauseLabel}
          seekLabel={seekLabel}
        />
      ) : (
        <div className="relative h-[min(78vh,860px)] w-[min(92vw,1100px)]">
          <Image key={item.src} src={item.src} alt="" fill className="object-contain" sizes="90vw" />
        </div>
      )}
    </div>
  );
}
