import { MatissMark } from "@/components/atoms/MatissMark";

export interface MatissLockupProps {
  /** Brand name from the brand layer. The first word is the wordmark, the rest is the tagline. */
  brandName: string;
  compact?: boolean;
}

export function MatissLockup({ brandName, compact = false }: MatissLockupProps) {
  const [word = "", ...rest] = brandName.trim().split(/\s+/);
  const tagline = rest.join(" ");

  return (
    <span className="inline-flex items-center gap-2.5">
      <MatissMark
        className={`shrink-0 transition-[width,height] duration-300 ${compact ? "h-9 w-9" : "h-11 w-11 md:h-12 md:w-12"}`}
      />
      <span className="flex flex-col leading-none">
        <span
          data-lockup-part
          className={`matiss-display lowercase text-[var(--matiss-violet-deep)] transition-[font-size] duration-300 ${compact ? "text-2xl" : "text-[1.75rem] md:text-3xl"}`}
        >
          {word}
        </span>
        {tagline ? (
          <span
            data-lockup-part
            className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.42em] text-[var(--matiss-rose-deep)]"
          >
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
