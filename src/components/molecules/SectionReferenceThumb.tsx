import Image from "next/image";

export function SectionReferenceThumb({
  src,
  alt,
  size = "md",
}: {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!src) return null;
  const dim = size === "sm" ? 40 : size === "lg" ? 96 : 56;
  return (
    <Image
      src={src}
      alt={alt}
      width={dim}
      height={dim}
      unoptimized
      className="shrink-0 rounded-[var(--layout-border-radius)] object-cover"
    />
  );
}
