"use client";

import type { NagoGalleryVideo } from "@/lib/landing/nagoGalleryCatalog";
import { NagoGalleryMediaTile } from "@/components/organisms/NagoGalleryMediaTile";

export interface NagoGalleryVideoBandProps {
  title: string;
  items: readonly NagoGalleryVideo[];
  tileLabel: (item: NagoGalleryVideo, index: number) => string;
  playLabel: string;
  onOpen: (index: number) => void;
  className?: string;
}

export function NagoGalleryVideoBand({
  title,
  items,
  tileLabel,
  playLabel,
  onOpen,
  className = "mt-8",
}: NagoGalleryVideoBandProps) {
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <p className="nago-display text-2xl text-[var(--nago-heading-solid)]">{title}</p>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {items.map((item, i) => {
          const portrait = item.height > item.width;
          return (
            <div key={item.src} className={portrait ? "w-40 shrink-0 sm:w-48" : "w-72 shrink-0"}>
              <NagoGalleryMediaTile
                item={item}
                label={tileLabel(item, i)}
                showPlay
                playLabel={playLabel}
                onOpen={() => onOpen(i)}
                imageClassName={
                  portrait
                    ? "aspect-[9/16] w-full object-cover"
                    : "aspect-video w-full object-cover"
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
