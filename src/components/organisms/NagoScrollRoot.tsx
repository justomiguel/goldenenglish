"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { applyNagoScrollAtmosphere } from "@/lib/landing/nagoScrollAtmosphere";

export function NagoScrollRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const landing =
      root.closest<HTMLElement>(".nago-landing") ?? root;
    let raf = 0;

    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      applyNagoScrollAtmosphere({
        landing,
        drifts: root.querySelectorAll<HTMLElement>("[data-nago-drift]"),
        scrollY: window.scrollY,
        maxScroll: max,
        viewportHeight: window.innerHeight,
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="nago-scroll-root">
      <div className="nago-scroll-progress" aria-hidden />
      {children}
    </div>
  );
}
