"use client";

import { useEffect, useRef, useState } from "react";

export interface PulsarNearFilmProps {
  src: string;
  poster?: string;
  className?: string;
}

export function PulsarNearFilm({ src, poster, className }: PulsarNearFilmProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") {
      const source = document.createElement("source");
      source.src = src;
      source.type = "video/webm";
      node.append(source);
      node.load();
      void node.play().catch(() => undefined);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setActive(true);
        observer.disconnect();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={active}
      preload="none"
      aria-hidden
    >
      {active ? <source src={src} type="video/webm" /> : null}
    </video>
  );
}
