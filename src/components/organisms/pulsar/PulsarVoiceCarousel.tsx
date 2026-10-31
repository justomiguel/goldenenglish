"use client";

import Image from "next/image";
import { useRef } from "react";
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

export function PulsarVoiceCarousel({ dict }: PulsarVoiceCarouselProps) {
  const copy = dict.pulsar.clients;
  const focus = dict.pulsar.commercial.voiceFocus;
  const scroller = useRef<HTMLUListElement>(null);

  function move(direction: -1 | 1) {
    const node = scroller.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: direction * Math.min(node.clientWidth * 0.86, 520), behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section className="border-b border-[var(--color-border)] py-16 md:py-24" aria-label={copy.voicesTitle}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.voicesTitle}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              aria-label={copy.voicesPrev}
              onClick={() => move(-1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              aria-label={copy.voicesNext}
              onClick={() => move(1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <ul
          ref={scroller}
          className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
        >
          {copy.voices.map((voice, index) => (
            <li key={voice.name} className="w-[min(100%,26rem)] shrink-0 snap-start">
              <article className="flex h-full flex-col bg-[var(--color-surface)] p-6">
                {focus[index] ? (
                  <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{focus[index]}</p>
                ) : null}
                <blockquote className="mt-3 flex-1">
                  <p className="font-display text-2xl font-medium leading-snug text-[var(--color-foreground)]">{voice.quote}</p>
                </blockquote>
                <footer className="mt-6 flex items-center gap-3">
                  <figure className="relative h-14 w-14 overflow-hidden">
                    <Image src={PORTRAITS[index] ?? PORTRAITS[0]} alt="" fill sizes="56px" className="object-cover" />
                  </figure>
                  <div>
                    <p className="text-base font-medium text-[var(--color-foreground)]">{voice.name}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{voice.role}</p>
                  </div>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
