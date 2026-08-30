"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LandingHeroPhoto } from "@/components/molecules/LandingHeroPhoto";

const ROTATE_MS = 7000;

export interface NagoHeroMotionProps {
  children: ReactNode;
  photoSrc: string;
  photoSrcs?: readonly string[];
  discover?: ReactNode;
  slidePrevLabel?: string;
  slideNextLabel?: string;
  slideGoToLabel?: string;
}

export function NagoHeroMotion({
  children,
  photoSrc,
  photoSrcs,
  discover,
  slidePrevLabel = "Previous",
  slideNextLabel = "Next",
  slideGoToLabel = "Go to photo {n}",
}: NagoHeroMotionProps) {
  const slides = photoSrcs && photoSrcs.length > 0 ? photoSrcs : [photoSrc];
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

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

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setIndex((current) => (current + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const go = (next: number) => {
    setIndex((next + slides.length) % slides.length);
  };

  return (
    <section
      ref={sectionRef}
      className="nago-hero-bg relative isolate"
      aria-labelledby="nago-hero-title"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div ref={parallaxRef} className="nago-hero-parallax" aria-hidden>
        <div className="nago-hero-ken">
          {slides.map((src, i) => (
            <div
              key={src}
              className={`nago-hero-slide${i === index ? " is-active" : ""}`}
            >
              <LandingHeroPhoto
                src={src}
                alt=""
                sizes="100vw"
                priority={i === 0}
                className="object-cover object-[center_42%]"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="nago-hero-overlay" aria-hidden />
      <div
        ref={lockupRef}
        className="nago-hero-content nago-hero-lockup mx-auto w-full max-w-7xl px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]"
      >
        {children}
      </div>
      {slides.length > 1 ? (
        <div className="nago-hero-carousel">
          <button
            type="button"
            className="nago-hero-arrow nago-hero-arrow-prev"
            aria-label={slidePrevLabel}
            onClick={() => go(index - 1)}
          >
            ‹
          </button>
          <div className="nago-hero-dots" role="tablist">
            {slides.map((src, i) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={slideGoToLabel.replace("{n}", String(i + 1))}
                className={`nago-hero-dot${i === index ? " is-active" : ""}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="nago-hero-arrow nago-hero-arrow-next"
            aria-label={slideNextLabel}
            onClick={() => go(index + 1)}
          >
            ›
          </button>
        </div>
      ) : null}
      {discover}
    </section>
  );
}
