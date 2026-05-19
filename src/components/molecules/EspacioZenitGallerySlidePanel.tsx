import Image from "next/image";
import { Loader2 } from "lucide-react";

export interface EspacioZenitGallerySlidePanelProps {
  images: readonly string[];
  index: number;
  slideLoading: boolean;
  setSlideLoading: (loading: boolean) => void;
  loadingLabel: string;
  objectClass: string;
  sizes: string;
  frameClass: string;
}

export function EspacioZenitGallerySlidePanel({
  images,
  index,
  slideLoading,
  setSlideLoading,
  loadingLabel,
  objectClass,
  sizes,
  frameClass,
}: EspacioZenitGallerySlidePanelProps) {
  const src = images[index]!;

  return (
    <div className={frameClass} aria-busy={slideLoading}>
      {slideLoading ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[color-mix(in_srgb,#070b12_88%,transparent)]"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="h-10 w-10 shrink-0 animate-spin text-[var(--ez-cyan)]"
            aria-hidden
            strokeWidth={2}
          />
          <span className="sr-only">{loadingLabel}</span>
        </div>
      ) : null}
      <Image
        key={src}
        src={src}
        alt=""
        fill
        className={`${objectClass} transition-opacity duration-500 ease-out ${slideLoading ? "opacity-0" : "opacity-100"}`}
        sizes={sizes}
        priority={index === 0}
        onLoad={() => setSlideLoading(false)}
        onError={() => setSlideLoading(false)}
      />
    </div>
  );
}
