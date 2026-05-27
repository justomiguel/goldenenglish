import type { CSSProperties } from "react";

/**
 * Mi Mundo — decorative floating doodles for non-hero sections.
 *
 * Renders a pointer-events:none, aria-hidden layer with small hand-drawn-style
 * SVG shapes (stars, hearts, scribble loops) drifting gently at different
 * speeds. Visual only. Respects prefers-reduced-motion via CSS.
 */

type DoodleKind = "star" | "heart" | "scribble" | "dot" | "spark";

interface Doodle {
  kind: DoodleKind;
  /** CSS color (e.g. "var(--mm-pink)"). */
  color: string;
  /** Size in px. */
  size: number;
  /** % horizontal position. */
  left: string;
  /** % vertical position. */
  top: string;
  /** Animation duration in seconds. */
  duration: number;
  /** Negative start delay so they don't all sync. */
  delay: number;
  /** Base rotation in degrees. */
  rotate: number;
}

const DOODLES: readonly Doodle[] = [
  { kind: "star",     color: "var(--mm-yellow-deep, #f5b800)", size: 28, left: "6%",  top: "12%", duration: 7, delay: -1, rotate: -12 },
  { kind: "heart",    color: "var(--mm-pink)",                 size: 24, left: "14%", top: "78%", duration: 9, delay: -3, rotate: 6 },
  { kind: "scribble", color: "var(--mm-violet)",               size: 40, left: "88%", top: "20%", duration: 10, delay: -5, rotate: 8 },
  { kind: "dot",      color: "var(--mm-blue)",                 size: 18, left: "92%", top: "62%", duration: 8, delay: -2, rotate: 0 },
  { kind: "star",     color: "var(--mm-pink)",                 size: 22, left: "48%", top: "8%",  duration: 11, delay: -6, rotate: 14 },
  { kind: "spark",    color: "var(--mm-green)",                size: 26, left: "30%", top: "92%", duration: 9, delay: -4, rotate: -8 },
  { kind: "heart",    color: "var(--mm-red)",                  size: 20, left: "78%", top: "88%", duration: 8, delay: -7, rotate: -10 },
  { kind: "scribble", color: "var(--mm-yellow-deep, #f5b800)", size: 36, left: "4%",  top: "48%", duration: 12, delay: -9, rotate: -6 },
] as const;

function DoodleShape({ kind, color, size }: { kind: DoodleKind; color: string; size: number }) {
  switch (kind) {
    case "star":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden style={{ color }}>
          <path
            d="M 16 2 L 19.5 12 L 30 13 L 21.5 19.5 L 24.5 30 L 16 24 L 7.5 30 L 10.5 19.5 L 2 13 L 12.5 12 Z"
            fill="currentColor"
            stroke="#3B2F2A"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "heart":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden style={{ color }}>
          <path
            d="M 16 28 C 4 20, 2 12, 7 7 C 12 2, 16 8, 16 8 C 16 8, 20 2, 25 7 C 30 12, 28 20, 16 28 Z"
            fill="currentColor"
            stroke="#3B2F2A"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "scribble":
      return (
        <svg width={size} height={size} viewBox="0 0 48 32" fill="none" aria-hidden style={{ color }}>
          <path
            d="M 4 24 C 8 12, 16 8, 22 16 S 32 28, 38 16 S 46 4, 44 22"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "dot":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ color }}>
          <circle cx="12" cy="12" r="9" fill="currentColor" stroke="#3B2F2A" strokeWidth="1.4" />
          <circle cx="9" cy="9" r="2.5" fill="rgba(255,255,255,0.75)" />
        </svg>
      );
    case "spark":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden style={{ color }}>
          <path
            d="M 16 4 L 16 28 M 4 16 L 28 16 M 7.5 7.5 L 24.5 24.5 M 24.5 7.5 L 7.5 24.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="3" fill="currentColor" />
        </svg>
      );
  }
}

interface MiMundoFloatingDoodlesProps {
  /** Optional override — accepts any subset for fewer doodles on tight sections. */
  count?: number;
}

export function MiMundoFloatingDoodles({ count }: MiMundoFloatingDoodlesProps) {
  const items = count ? DOODLES.slice(0, count) : DOODLES;
  return (
    <div className="mm-doodle-layer" aria-hidden>
      {items.map((d, i) => (
        <span
          key={i}
          className={`mm-doodle mm-doodle--${d.kind}`}
          style={
            {
              left: d.left,
              top: d.top,
              "--mm-doodle-dur": `${d.duration}s`,
              "--mm-doodle-delay": `${d.delay}s`,
              "--mm-doodle-rotate": `${d.rotate}deg`,
            } as CSSProperties
          }
        >
          <DoodleShape kind={d.kind} color={d.color} size={d.size} />
        </span>
      ))}
    </div>
  );
}
