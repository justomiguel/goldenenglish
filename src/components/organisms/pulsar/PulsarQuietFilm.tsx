"use client";

import { useEffect, useRef } from "react";

function assignFilmSrc(node: HTMLVideoElement, src: string) {
  node.src = src;
  if (typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom")) return;
  const played = node.play?.();
  if (played && typeof played.catch === "function") void played.catch(() => undefined);
}

export interface PulsarQuietFilmProps {
  src: string;
  className?: string;
  testId?: string;
  deferUntilVisible?: boolean;
}

export function PulsarQuietFilm({
  src,
  className,
  testId,
  deferUntilVisible = false,
}: PulsarQuietFilmProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      node.pause();
      node.removeAttribute("src");
      return;
    }
    if (!deferUntilVisible || typeof IntersectionObserver === "undefined") {
      assignFilmSrc(node, src);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        assignFilmSrc(node, src);
        observer.disconnect();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [src, deferUntilVisible]);

  return (
    <video
      ref={ref}
      data-testid={testId}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      className={className}
    />
  );
}
