import Image from "next/image";

export type LandingHeroPhotoProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function LandingHeroPhoto({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: LandingHeroPhotoProps) {
  const bypassOptimizer = src.startsWith("/images/");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized={bypassOptimizer}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
