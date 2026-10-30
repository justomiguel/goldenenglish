"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface PulsarVoiceCarouselProps {
  dict: Dictionary;
}

const PORTRAITS = [
  "/centrolisto/voices/camila.jpg",
  "/centrolisto/voices/mateo.jpg",
  "/centrolisto/voices/andrea-office.jpg",
  "/centrolisto/voices/rodrigo.jpg",
  "/centrolisto/voices/sofia.jpg",
  "/centrolisto/voices/luis.jpg",
] as const;
const AUTOPLAY_MS = 6500;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PulsarVoiceCarousel({ dict }: PulsarVoiceCarouselProps) {
  const copy = dict.pulsar.clients;
  const voices = copy.voices;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const lockRef = useRef(false);
  const [index, setIndex] = useState(0);
  const count = voices.length;

  const go = (next: number) => {
    const i = (next + count) % count;
    lockRef.current = true;
    setIndex(i);
    const root = scrollerRef.current;
    const slide = root?.children[i] as HTMLElement | undefined;
    if (typeof slide?.scrollIntoView === "function") {
      slide.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        inline: "start",
        block: "nearest",
      });
    }
    window.setTimeout(() => {
      lockRef.current = false;
    }, 700);
  };

  useEffect(() => {
    const root = scrollerRef.current;
    if (typeof root?.scrollTo === "function") root.scrollTo({ left: 0 });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion() || count < 2) return;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      setIndex((current) => {
        const i = (current + 1) % count;
        const root = scrollerRef.current;
        lockRef.current = true;
        const slide = root?.children[i] as HTMLElement | undefined;
        if (typeof slide?.scrollIntoView === "function") {
          slide.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        }
        window.setTimeout(() => {
          lockRef.current = false;
        }, 700);
        return i;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  const position = copy.voicesPosition
    .replace("{current}", String(index + 1))
    .replace("{total}", String(count));

  return (
    <section
      className="py-10 md:py-14"
      aria-roledescription="carousel"
      aria-label={copy.voicesTitle}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onFocus={() => {
        pausedRef.current = true;
      }}
      onBlur={() => {
        pausedRef.current = false;
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {copy.voicesTitle}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {copy.voicesLead}
        </p>
        <div
          ref={scrollerRef}
          className="mt-8 flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(event) => {
            if (lockRef.current) return;
            const root = event.currentTarget;
            const slide = root.children[0] as HTMLElement | undefined;
            if (!slide || slide.offsetWidth === 0) return;
            const i = Math.round(root.scrollLeft / slide.offsetWidth);
            setIndex(Math.min(count - 1, Math.max(0, i)));
          }}
        >
          {voices.map((voice, i) => (
            <article
              key={voice.name}
              className="w-full shrink-0 snap-start"
              aria-current={i === index ? "true" : undefined}
            >
              <div className="grid items-center gap-4 sm:grid-cols-[11rem_1fr]">
                <figure className="relative mx-auto aspect-[3/4] w-36 overflow-hidden rounded-2xl sm:mx-0 sm:w-full">
                  <Image
                    src={PORTRAITS[i] ?? PORTRAITS[0]}
                    alt=""
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                </figure>
                <div className="min-w-0">
                  <div className="relative rounded-3xl bg-[var(--color-primary)] px-6 py-5 text-[var(--color-primary-foreground)]">
                    <span
                      className="absolute left-10 -top-2 h-4 w-4 rotate-45 bg-[var(--color-primary)] sm:-left-2 sm:top-8"
                      aria-hidden
                    />
                    <p className="relative font-display text-2xl font-medium leading-snug sm:text-3xl">
                      {voice.quote}
                    </p>
                  </div>
                  <p className="mt-4 text-base font-medium text-[var(--color-foreground)]">{voice.name}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{voice.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            aria-label={copy.voicesPrev}
            onClick={() => go(index - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            aria-label={copy.voicesNext}
            onClick={() => go(index + 1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <p className="ms-2 text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
            {position}
          </p>
        </div>
      </div>
    </section>
  );
}
