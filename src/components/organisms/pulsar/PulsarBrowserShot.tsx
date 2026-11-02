import Image from "next/image";

export interface PulsarBrowserShotProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}

export function PulsarBrowserShot({ src, alt, priority = false, className, imageClassName }: PulsarBrowserShotProps) {
  return (
    <figure className={`overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] ${className ?? ""}`}>
      <div className="flex h-8 items-center gap-1.5 border-b border-[var(--color-border)] px-3" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-[var(--color-muted)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--color-muted)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--color-muted)]" />
      </div>
      <div className="relative aspect-[16/10]">
        <Image src={src} alt={alt} fill priority={priority} sizes="(min-width: 1024px) 36rem, 100vw" className={imageClassName ?? "object-cover object-top"} />
      </div>
    </figure>
  );
}
