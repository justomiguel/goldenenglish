"use client";

import Image from "next/image";
import {
  NAGO_GALLERY_EVENT_IDS,
  nagoGalleryPreviewItems,
  nagoGalleryVideoPreviewItems,
  type NagoGalleryEventId,
} from "@/lib/landing/nagoGalleryCatalog";
import { NagoGalleryVideoBand } from "@/components/organisms/NagoGalleryVideoBand";
import { NagoReveal } from "@/components/organisms/NagoReveal";

export interface NagoGalleryEventGroupsProps {
  eventName: (eventId: NagoGalleryEventId) => string;
  videosLabel: string;
  playLabel: string;
  photoLabel: (index: number) => string;
  videoLabel: (index: number) => string;
  onOpenPhoto: (eventId: NagoGalleryEventId, index: number) => void;
  onOpenVideo: (eventId: NagoGalleryEventId, index: number) => void;
}

export function NagoGalleryEventGroups({
  eventName,
  videosLabel,
  playLabel,
  photoLabel,
  videoLabel,
  onOpenPhoto,
  onOpenVideo,
}: NagoGalleryEventGroupsProps) {
  return (
    <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-16">
      {NAGO_GALLERY_EVENT_IDS.map((eventId) => {
        const preview = nagoGalleryPreviewItems(eventId);
        const clips = nagoGalleryVideoPreviewItems(eventId);
        return (
          <NagoReveal key={eventId} variant="block">
            <h3 className="nago-display text-3xl text-[var(--nago-heading-solid)] md:text-4xl">
              {eventName(eventId)}
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {preview.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  className="group block min-h-[44px] overflow-hidden border-0 bg-transparent p-0 text-left"
                  onClick={() => onOpenPhoto(eventId, i)}
                  aria-label={photoLabel(i)}
                >
                  <Image
                    src={item.src}
                    alt=""
                    width={item.width}
                    height={item.height}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] motion-reduce:transform-none"
                    sizes="(max-width:640px) 33vw, 28vw"
                  />
                </button>
              ))}
            </div>
            <NagoGalleryVideoBand
              title={videosLabel}
              items={clips}
              tileLabel={(_item, i) => videoLabel(i)}
              playLabel={playLabel}
              onOpen={(i) => onOpenVideo(eventId, i)}
            />
          </NagoReveal>
        );
      })}
    </div>
  );
}
