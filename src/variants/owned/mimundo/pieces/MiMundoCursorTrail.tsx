"use client";

import { useEffect, useRef } from "react";

/**
 * Number of recycled dots in the cursor trail. A circular buffer is small
 * enough to keep paint cost low while leaving a visible 4-5 frame tail.
 */
const TRAIL_COUNT = 18;

/**
 * Theme palette. We rotate through these per emission so a single sweep paints
 * a multi-coloured estela — same palette used across the rest of the landing.
 */
const COLORS = [
  "var(--mm-pink)",
  "var(--mm-yellow)",
  "var(--mm-green)",
  "var(--mm-blue)",
  "var(--mm-violet)",
  "var(--mm-yellow-deep)",
];

/**
 * Renders a fixed full-viewport layer of recycled dots. On mousemove we move
 * one dot to the cursor position and replay its pop animation; the next event
 * uses the next dot in the ring so older dots keep fading without re-painting.
 *
 * Honours `prefers-reduced-motion` (no listener registered) and `pointer: fine`
 * (skipped on touch). Layer is `pointer-events: none` so it never blocks
 * clicks, hovers or scrolls on the actual content.
 */
export function MiMundoCursorTrail() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only emit on devices with a real fine pointer (mouse/trackpad). Touch
    // devices have no hover anyway and would otherwise paint on every tap.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const layer = layerRef.current;
    if (!layer) return;

    const dots = Array.from(layer.children) as HTMLElement[];
    let idx = 0;
    let lastEmit = 0;
    let lastX = 0;
    let lastY = 0;

    const onMove = (event: MouseEvent) => {
      const now = performance.now();
      // Throttle emissions to ~28/s — enough to feel continuous, gentle on GPU.
      if (now - lastEmit < 35) return;
      // Skip micro-movements (browser fires mousemove during scroll inertia).
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.hypot(dx, dy) < 6) return;

      lastEmit = now;
      lastX = event.clientX;
      lastY = event.clientY;

      const dot = dots[idx];
      idx = (idx + 1) % TRAIL_COUNT;

      // Vary colour + size + rotation per emission so the trail feels organic.
      dot.style.left = `${event.clientX}px`;
      dot.style.top = `${event.clientY}px`;
      dot.style.background = COLORS[idx % COLORS.length] as string;
      const size = 8 + Math.random() * 8; // 8-16px
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.setProperty("--mm-cursor-drift-x", `${(Math.random() - 0.5) * 28}px`);
      dot.style.setProperty("--mm-cursor-drift-y", `${(Math.random() - 0.5) * 28 - 12}px`);
      dot.style.setProperty("--mm-cursor-rotate", `${(Math.random() - 0.5) * 240}deg`);

      // Restart the CSS animation by toggling the class with a forced reflow.
      dot.classList.remove("mm-cursor-dot-anim");
      void dot.offsetWidth;
      dot.classList.add("mm-cursor-dot-anim");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={layerRef}
      className="mm-cursor-trail-layer pointer-events-none fixed inset-0 z-[45]"
      aria-hidden
    >
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <span key={i} className="mm-cursor-dot" />
      ))}
    </div>
  );
}
