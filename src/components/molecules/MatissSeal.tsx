import { useId } from "react";

export type MatissSealSize = "lg" | "md" | "sm";

export interface MatissSealProps {
  /** Circular text around the logo, from `landing.matiss.seal.ring`. */
  ring: string;
  logoSrc: string;
  /** Set it only on the seal that stands for the brand. Without it the seal is decorative. */
  logoAlt?: string;
  size: MatissSealSize;
  /** Turns against the page scroll, so seals next to each other move in opposite ways. */
  reverse?: boolean;
  /** Placement only (position, offsets, visibility). The seal sets its own size. */
  className?: string;
}

const SIZE_CLASS: Record<MatissSealSize, string> = {
  lg: "h-32 w-32 md:h-44 md:w-44",
  md: "h-24 w-24 md:h-32 md:w-32",
  sm: "h-24 w-24",
};

const RING_RADIUS = 80;
const RING_LENGTH = Math.round(2 * Math.PI * RING_RADIUS);

export function MatissSeal({ ring, logoSrc, logoAlt, size, reverse = false, className = "" }: MatissSealProps) {
  const pathId = `matiss-seal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const decorative = !logoAlt;

  return (
    <div data-matiss-seal aria-hidden={decorative ? "true" : undefined} className={`pointer-events-none ${className}`.trim()}>
      <div
        className={`relative rounded-full bg-[var(--matiss-paper)] shadow-[0_18px_40px_-20px_var(--matiss-violet-deep)] ${SIZE_CLASS[size]}`}
      >
        <span className={`matiss-seal-ring absolute inset-0 block ${reverse ? "matiss-seal-ring--reverse" : ""}`.trim()}>
          <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true" focusable="false">
            <path
              id={pathId}
              d={`M100,100 m-${RING_RADIUS},0 a${RING_RADIUS},${RING_RADIUS} 0 1,1 ${RING_RADIUS * 2},0 a${RING_RADIUS},${RING_RADIUS} 0 1,1 -${RING_RADIUS * 2},0`}
              fill="none"
            />
            <text className="fill-[var(--matiss-violet-deep)] text-[15px] font-semibold uppercase tracking-[0.14em]">
              <textPath href={`#${pathId}`} textLength={RING_LENGTH} lengthAdjust="spacing">
                {ring}
              </textPath>
            </text>
          </svg>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- brand logo path from the brand layer */}
        <img
          src={logoSrc}
          alt={logoAlt ?? ""}
          width={512}
          height={512}
          loading={size === "lg" ? "eager" : "lazy"}
          decoding="async"
          className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
        />
      </div>
    </div>
  );
}
