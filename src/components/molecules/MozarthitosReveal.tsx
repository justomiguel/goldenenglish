"use client";

import { useEffect, useRef, useState } from "react";

export type MozarthitosRevealPreset =
  | "heroImage"
  | "heroTitle"
  | "quienesHeading"
  | "origenesCard"
  | "llegadaCard"
  | "bioTabs"
  | "bioPortrait"
  | "cursosAsideDesktop"
  | "cursosMainStack"
  | "cursosAsideMobile"
  | "sedesIntro"
  | "sedeDetail"
  | "contactColLeft"
  | "contactColRight";

export interface MozarthitosRevealProps {
  preset: MozarthitosRevealPreset;
  className?: string;
  children: React.ReactNode;
  /** Intersects sooner so above-the-fold blocks animate right away */
  eager?: boolean;
}

export function MozarthitosReveal({
  preset,
  className,
  children,
  eager = false,
}: MozarthitosRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => {
        setInView(true);
      });
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      {
        rootMargin: eager ? "140px 0px 140px 0px" : "0px 0px -8% 0px",
        threshold: eager ? 0 : 0.08,
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  const cls = ["mz-reveal", inView ? "mz-reveal--in" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={cls} data-preset={preset}>
      {children}
    </div>
  );
}
