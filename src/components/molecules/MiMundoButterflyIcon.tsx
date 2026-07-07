import {
  MIMUNDO_DECORATIVE_BUTTERFLY_ASPECT,
  MIMUNDO_DECORATIVE_BUTTERFLY_SRC,
} from "@/lib/landing/mimundoLandingImages";

/** Logo butterfly asset — decorative only. */
export function MiMundoButterflyIcon({
  size,
}: {
  size: number;
  /** @deprecated Multicolor asset; kept for call-site compatibility. */
  color?: string;
}) {
  const height = Math.round(size / MIMUNDO_DECORATIVE_BUTTERFLY_ASPECT);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static /public crop
    <img
      src={MIMUNDO_DECORATIVE_BUTTERFLY_SRC}
      alt=""
      width={size}
      height={height}
      aria-hidden
      decoding="async"
      className="block max-w-none object-contain"
      style={{ width: size, height }}
    />
  );
}
