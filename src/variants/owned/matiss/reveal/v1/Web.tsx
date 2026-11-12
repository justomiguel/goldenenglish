"use client";

import { useEffect, useRef, useState } from "react";

export type MatissRevealPreset = "band" | "section" | "steps";

export interface MatissRevealProps {
  preset: MatissRevealPreset;
  className?: string;
  children: React.ReactNode;
  eager?: boolean;
}

type Phase = "plain" | "wait" | "in";

export function MatissReveal({ preset, className, children, eager = false }: MatissRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("plain");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setPhase("in");
        io.disconnect();
      },
      {
        rootMargin: eager ? "140px 0px 140px 0px" : "0px 0px -8% 0px",
        threshold: eager ? 0 : 0.08,
      },
    );

    io.observe(el);
    const box = el.getBoundingClientRect();
    if (box.top >= window.innerHeight) queueMicrotask(() => setPhase("wait"));
    return () => io.disconnect();
  }, [eager]);

  const cls = ["matiss-reveal", phase === "wait" ? "matiss-reveal--wait" : "", phase === "in" ? "matiss-reveal--in" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={cls} data-preset={preset}>
      {children}
    </div>
  );
}

export default MatissReveal;
