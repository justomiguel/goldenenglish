"use client";

import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MiMundoButterflyTrails } from "@/components/molecules/MiMundoButterflyTrails";

interface MiMundoHeroProps {
  dict: Dictionary;
  locale: string;
  logoPath: string;
  logoAlt: string;
}

/** Confetti seeds: deterministic, hand-tuned for an airy/balanced spread. */
const CONFETTI = [
  { left: "6%", color: "var(--mm-yellow)", dur: 9, delay: -1, x: "30px", shape: "" },
  { left: "14%", color: "var(--mm-pink)", dur: 11, delay: -3, x: "-40px", shape: "tri" },
  { left: "22%", color: "var(--mm-blue)", dur: 8, delay: -5, x: "20px", shape: "sq" },
  { left: "34%", color: "var(--mm-yellow)", dur: 13, delay: -2, x: "-30px", shape: "" },
  { left: "48%", color: "var(--mm-pink)", dur: 10, delay: -6, x: "60px", shape: "" },
  { left: "60%", color: "var(--mm-violet)", dur: 12, delay: -4, x: "-20px", shape: "tri" },
  { left: "72%", color: "var(--mm-yellow)", dur: 9, delay: -7, x: "40px", shape: "sq" },
  { left: "84%", color: "var(--mm-pink)", dur: 11, delay: -1, x: "-50px", shape: "" },
  { left: "92%", color: "var(--mm-blue)", dur: 10, delay: -5, x: "30px", shape: "tri" },
] as const;

export function MiMundoHero({ dict, locale, logoPath, logoAlt }: MiMundoHeroProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);
  const tagline = t("hero.kicker");
  const title = t("hero.title");
  const titleWords = title.split(/\s+/).filter(Boolean);

  return (
    <section
      className="mm-hero-bg relative isolate overflow-hidden"
      aria-labelledby="mm-hero-title"
    >
      {/* Watercolor green blob, echoes the logo's tree */}
      <div
        className="mm-hero-blob absolute -left-[12%] top-[2%] h-[70%] w-[70%] md:h-[80%] md:w-[55%]"
        aria-hidden
      />

      {/* Back-layer butterflies (z behind hero text) — calm + slow */}
      <MiMundoButterflyTrails layer="back" />

      {/* Floating confetti */}
      <div className="mm-confetti-layer" aria-hidden>
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={`mm-confetti${c.shape ? ` mm-confetti--${c.shape}` : ""}`}
            style={
              {
                left: c.left,
                "--mm-confetti-color": c.color,
                "--mm-confetti-dur": `${c.dur}s`,
                "--mm-confetti-delay": `${c.delay}s`,
                "--mm-confetti-x": c.x,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/*
        Hero layout sizing notes:
        - `max-w-4xl` (≈56rem) instead of 5xl/6xl — keeps the title from
          stretching edge-to-edge on 1440-1920 screens and reduces the
          mascot's distance from the copy column.
        - No `min-h-*` at any breakpoint here OR in `.mm-hero-bg` — the
          section's height is its content + padding only. On 1080p laptops
          this keeps the "Reservar mi cupo" CTA above the fold (previously
          a forced 80vh pushed it just out of view).
        - Padding curve: `py-7` mobile (~28px each side) → `sm:py-10` →
          `md:py-12`. Generous on desktop, tight on phones so the entire
          hero fits in one mobile viewport without scrolling.
      */}
      <div className="mm-hero-content relative z-[5] mx-auto grid max-w-4xl grid-cols-1 items-center gap-6 px-[max(1.25rem,env(safe-area-inset-left))] py-7 pe-[max(1.25rem,env(safe-area-inset-right))] sm:gap-8 sm:py-10 md:gap-10 md:py-12 md:grid-cols-[1.05fr_auto]">
        {/* Copy column */}
        <div>
          {tagline ? (
            <span className="mm-hero-reveal mm-hero-reveal-1 mm-kicker-pill mb-2 md:mb-4">
              {tagline}
            </span>
          ) : null}

          {/*
            Title — each word renders inside its own painted brush stroke
            (see `.mm-hero-title .mm-title-word` in mimundoLanding.css, with
            frayed-edge SVG masks in `/images/mimundo/decorations/`). The
            wrapper span no longer paints a giant ellipse; instead per-word
            painted strokes size themselves to each word, so no locale /
            word-count combination can overflow a fixed background shape any
            more. AA contrast is per-stroke: yellow + ink-deep ≈ 14:1,
            green + white ≈ 5:1.

            Title sizes capped at `lg:text-5xl` (48px). The previous
            `lg:text-7xl` (72px) combined with the narrower `max-w-4xl`
            content grid forced the title into 5-6 wrapped lines on
            desktop, pushing the CTA below the fold; capping at 5xl
            keeps it to ~2 lines on lg.
          */}
          <h1
            id="mm-hero-title"
            className="mm-hero-reveal mm-hero-reveal-2 max-w-2xl"
          >
            <span className="mm-sticker-title mm-hero-title text-balance text-3xl sm:text-4xl md:text-[2.6rem] lg:text-5xl">
              {titleWords.map((word, i) => (
                <span key={`${word}-${i}`} className="mm-title-word">
                  {word}
                </span>
              ))}
            </span>
          </h1>

          {/* Hand-drawn scribble underline */}
          <svg
            className="mm-hero-reveal mm-hero-reveal-2 mm-hero-scribble"
            viewBox="0 0 320 18"
            fill="none"
            aria-hidden
          >
            <path
              d="M 4 12 C 40 2, 80 16, 120 8 S 200 16, 240 6 S 300 14, 316 8"
              stroke="#FFD426"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 8 16 C 60 8, 120 18, 180 10 S 260 16, 308 12"
              stroke="#EC2E88"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
          </svg>

          {/* Subtitle — cream chip for AA on warm brown */}
          <p className="mm-hero-reveal mm-hero-reveal-3 mm-sticker-cream mt-3 max-w-md text-sm font-medium leading-snug sm:text-base md:mt-5 md:text-base lg:text-lg">
            {t("hero.subtitle")}
          </p>

          {/* CTA cluster: callout + sticker button */}
          <div className="mm-hero-reveal mm-hero-reveal-4 mt-4 flex flex-wrap items-center gap-3 md:mt-6 md:gap-4">
            <span className="mm-cta-callout" aria-hidden>
              {t("hero.ctaCallout")}
              <svg
                className="-mt-1 ms-1 inline-block h-7 w-12"
                viewBox="0 0 48 28"
                fill="none"
                aria-hidden
              >
                <path
                  d="M 2 6 C 12 22, 28 22, 42 16"
                  stroke="#FFD426"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="3 6"
                  fill="none"
                />
                <path
                  d="M 42 16 L 36 10 M 42 16 L 38 22"
                  stroke="#FFD426"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
            <Link
              href={`/${locale}/register`}
              className="mm-cta-sticker"
              aria-label={t("hero.ctaReservar")}
            >
              <Sparkles className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2.4} />
              {t("hero.ctaReservar")}
            </Link>
          </div>
        </div>

        {/* Mascot logo column — circular orbit composition (logo centred in spinning multicolor ring). */}
        <div className="mm-hero-reveal mm-hero-reveal-5 hidden justify-self-center md:block md:justify-self-end">
          <div className="mm-logo-orbit mm-mascot-bob">
            <div className="mm-logo-orbit-ring" aria-hidden />
            <div className="mm-logo-orbit-ring-dash" aria-hidden />
            <div className="mm-logo-halo">
              <Image
                src={logoPath}
                alt={logoAlt}
                width={360}
                height={360}
                priority
                className="mm-logo-halo-img"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Front-layer butterflies (z above hero text) — fast comet butterflies that dart across */}
      <MiMundoButterflyTrails layer="front" />
    </section>
  );
}
