import { Heart } from "lucide-react";

export interface LioraSectionHeadingProps {
  title: string;
  /** Second line in the script face, as on the studio flyers. */
  script?: string;
  lead?: string;
  align?: "start" | "center" | "end";
  as?: "h1" | "h2";
  id?: string;
  /** Larger type for the hero. */
  size?: "section" | "hero";
}

const ALIGN_CLASS = {
  start: "text-start",
  center: "mx-auto text-center",
  end: "lg:ms-auto lg:text-end",
} as const;

export function LioraSectionHeading({
  title,
  script = "",
  lead = "",
  align = "center",
  as: Tag = "h2",
  id,
  size = "section",
}: LioraSectionHeadingProps) {
  const titleSize =
    size === "hero" ? "text-6xl sm:text-7xl lg:text-8xl" : "text-4xl md:text-5xl";
  const scriptSize =
    size === "hero" ? "text-5xl sm:text-6xl lg:text-7xl" : "text-4xl md:text-[3.25rem]";

  return (
    <div className={`max-w-2xl ${ALIGN_CLASS[align]}`}>
      <Tag
        id={id}
        className={`text-balance font-[family-name:var(--font-liora-display)] font-medium leading-[1.02] tracking-[0.01em] text-[var(--liora-rose-title)] ${titleSize}`}
      >
        {title}
        {script ? (
          <span className={`liora-script mt-1 block leading-[1.1] text-[var(--liora-rose-deep)] ${scriptSize}`}>
            {script}
          </span>
        ) : null}
      </Tag>
      <span
        className="liora-heart-rule mt-5"
        data-align={align}
        aria-hidden
      >
        <Heart className="h-3 w-3 shrink-0" fill="currentColor" strokeWidth={0} />
      </span>
      {lead ? (
        <p className="mt-6 text-pretty text-base leading-relaxed text-[var(--liora-ink-soft)] md:text-lg">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
