"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { NagoGalleryItem } from "@/lib/landing/nagoGalleryCatalog";

export interface NagoGalleryMediaTileProps {
  item: NagoGalleryItem;
  label: string;
  onOpen: () => void;
  showPlay?: boolean;
  playLabel?: string;
  imageClassName?: string;
}

export function NagoGalleryMediaTile({
  item,
  label,
  onOpen,
  showPlay = false,
  playLabel,
  imageClassName = "h-auto w-full object-cover",
}: NagoGalleryMediaTileProps) {
  const src = item.kind === "video" ? item.poster : item.src;
  return (
    <button
      type="button"
      className="relative block min-h-[44px] w-full overflow-hidden border-0 bg-transparent p-0 text-left"
      onClick={onOpen}
      aria-label={label}
    >
      <Image
        src={src}
        alt=""
        width={item.width}
        height={item.height}
        className={imageClassName}
        sizes="(max-width:640px) 40vw, 16rem"
      />
      {showPlay ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex min-h-[44px] items-center gap-2 bg-black px-3 text-sm font-semibold text-white">
          <Play className="h-4 w-4 shrink-0" aria-hidden />
          {playLabel}
        </span>
      ) : null}
    </button>
  );
}
