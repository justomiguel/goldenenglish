import Image from "next/image";

interface PublicContentCoverThumbProps {
  src: string;
  alt: string;
  className?: string;
}

export function PublicContentCoverThumb({ src, alt, className }: PublicContentCoverThumbProps) {
  const unoptimized = src.startsWith("/images/") || src.startsWith("data:");
  return (
    <div
      className={
        className ??
        "relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]"
      }
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="64px"
        unoptimized={unoptimized}
      />
    </div>
  );
}
