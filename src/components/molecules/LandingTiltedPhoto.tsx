import Image from "next/image";

type LandingTiltedPhotoAspect = "4/3" | "square";

interface LandingTiltedPhotoProps {
  src: string;
  alt: string;
  className?: string;
  /** Tailwind rotate utilities, e.g. `-rotate-6 motion-reduce:rotate-0` */
  rotateClass?: string;
  sizes?: string;
  aspect?: LandingTiltedPhotoAspect;
  /** Above-the-fold / LCP: eager fetch (see Next.js Image `priority`) */
  priority?: boolean;
}

const aspectClass: Record<LandingTiltedPhotoAspect, string> = {
  "4/3": "aspect-[4/3]",
  square: "aspect-square",
};

export function LandingTiltedPhoto({
  src,
  alt,
  className = "",
  rotateClass = "-rotate-2",
  sizes = "(max-width: 768px) 50vw, 260px",
  aspect = "4/3",
  priority = false,
}: LandingTiltedPhotoProps) {
  const bypassOptimizer = src.startsWith("/images/");
  return (
    <div
      className={`${rotateClass} motion-reduce:rotate-0 motion-reduce:transform-none ${className}`}
    >
      <div className="overflow-hidden rounded-[var(--layout-border-radius)] border-[0.35rem] border-[var(--color-accent)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ring-1 ring-[var(--color-primary)]/15">
        <div className={`relative w-full ${aspectClass[aspect]}`}>
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized={bypassOptimizer}
            className="object-cover"
            sizes={sizes}
            priority={priority}
          />
        </div>
      </div>
    </div>
  );
}
