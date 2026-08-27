"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { LandingHeroPhoto } from "@/components/molecules/LandingHeroPhoto";

export interface NagoHeroMotionProps {
  children: ReactNode;
  photoSrc: string;
}

export function NagoHeroMotion({ children, photoSrc }: NagoHeroMotionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const parallax = parallaxRef.current;
    const lockup = lockupRef.current;
    if (!section || !parallax || !lockup) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      const top = section.getBoundingClientRect().top;
      const height = section.offsetHeight;
      const scrolled = Math.min(Math.max(-top, 0), height);
      const progress = height === 0 ? 0 : scrolled / height;
      parallax.style.transform = `translate3d(0, ${scrolled * 0.26}px, 0)`;
      lockup.style.opacity = String(Math.max(1 - progress * 1.4, 0));
      lockup.style.transform = `translate3d(0, ${scrolled * 0.16}px, 0)`;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="nago-hero-bg relative isolate"
      aria-labelledby="nago-hero-title"
    >
      <div ref={parallaxRef} className="nago-hero-parallax" aria-hidden>
        <div className="nago-hero-ken">
          <LandingHeroPhoto
            src={photoSrc}
            alt=""
            sizes="100vw"
            priority
            className="object-cover object-[center_42%]"
          />
        </div>
      </div>
      <div className="nago-hero-overlay" aria-hidden />
      <div
        ref={lockupRef}
        className="nago-hero-content nago-hero-lockup nago-type-c px-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))]"
      >
        {children}
      </div>
    </section>
  );
}
