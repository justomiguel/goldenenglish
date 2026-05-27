"use client";

import type { CSSProperties } from "react";
import { MiMundoButterflyIcon } from "@/components/molecules/MiMundoButterflyIcon";
import {
  MIMUNDO_BACK_BUTTERFLY_TRAILS,
  MIMUNDO_FRONT_BUTTERFLY_TRAILS,
} from "@/lib/landing/mimundoButterflyTrailPaths";

/**
 * Mi Mundo — decorative butterfly trails.
 *
 * Renders dashed flight-path curves (as in the institute logo) and butterflies
 * that animate along them via CSS `offset-path`. Pure visual, aria-hidden.
 *
 * The hero composes TWO layers:
 *   - `layer="back"`  → behind the hero text (z-2). Big, slow, calm.
 *   - `layer="front"` → in front of the hero text (z-7). Smaller, fast, playful.
 *
 * Respects prefers-reduced-motion (see CSS in mimundoLanding.css).
 */

interface MiMundoButterflyTrailsProps {
  layer?: "back" | "front";
}

export function MiMundoButterflyTrails({
  layer = "back",
}: MiMundoButterflyTrailsProps) {
  const trails =
    layer === "front" ? MIMUNDO_FRONT_BUTTERFLY_TRAILS : MIMUNDO_BACK_BUTTERFLY_TRAILS;
  const layerClass =
    layer === "front"
      ? "pointer-events-none absolute inset-0 z-[7]"
      : "pointer-events-none absolute inset-0 z-[2]";
  const trailsToDraw = trails.filter((t) => !t.hideTrail);

  return (
    <div className={layerClass} aria-hidden>
      {trailsToDraw.length > 0 ? (
        <svg
          viewBox="0 0 1200 720"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-90"
        >
          {trailsToDraw.map((trail) => (
            <path
              key={trail.id}
              d={trail.d}
              fill="none"
              stroke="#FFF8EC"
              strokeOpacity="0.78"
              strokeWidth="2.4"
              strokeDasharray="8 10"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {layer === "back" ? (
            <path
              d="M 1240 760 L 1226 738 M 1240 760 L 1262 748"
              stroke="#FFF8EC"
              strokeOpacity="0.85"
              strokeWidth="2.4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      ) : null}

      {trails.map((trail) => (
        <span
          key={trail.id}
          className="mm-trail-flyer"
          style={
            {
              "--mm-flight-offset": trail.offset,
              "--mm-flight-duration": `${trail.duration}s`,
              "--mm-flight-delay": `${trail.delay}s`,
              "--mm-flight-direction": trail.reverse ? "reverse" : "normal",
            } as CSSProperties
          }
        >
          <span
            className={
              layer === "front"
                ? "mm-trail-flyer-wings mm-wing-fast"
                : "mm-trail-flyer-wings"
            }
          >
            <MiMundoButterflyIcon size={trail.size} color={trail.colorVar} />
          </span>
        </span>
      ))}
    </div>
  );
}
