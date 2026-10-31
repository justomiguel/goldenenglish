"use client";

import { useEffect, useRef } from "react";

export interface PulsarProductVideoProps {
  src: string;
  poster: string;
  label: string;
  className?: string;
}

export function PulsarProductVideo({ src, poster, label, className }: PulsarProductVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) void node.play().catch(() => undefined);
        else node.pause();
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      playsInline
      loop
      preload="none"
      aria-label={label}
      className={className ?? "aspect-[4/3] w-full object-cover object-top"}
    >
      <source src={src} type="video/webm" />
    </video>
  );
}
