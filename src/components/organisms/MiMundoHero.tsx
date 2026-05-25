"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

interface MiMundoHeroProps {
  dict: Dictionary;
  locale: string;
}

/** Butterfly SVG — decorative, aria-hidden */
function Butterfly({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* left wing */}
      <ellipse cx="18" cy="22" rx="17" ry="13" fill="currentColor" opacity="0.82" />
      {/* right wing */}
      <ellipse cx="46" cy="22" rx="17" ry="13" fill="currentColor" opacity="0.72" />
      {/* lower left */}
      <ellipse cx="20" cy="34" rx="11" ry="9" fill="currentColor" opacity="0.65" />
      {/* lower right */}
      <ellipse cx="44" cy="34" rx="11" ry="9" fill="currentColor" opacity="0.58" />
      {/* body */}
      <ellipse cx="32" cy="26" rx="3.5" ry="12" fill="#6D4C41" opacity="0.7" />
    </svg>
  );
}

export function MiMundoHero({ dict, locale }: MiMundoHeroProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);
  const tagline = t("hero.kicker");

  return (
    <section
      className="mm-hero-bg relative isolate overflow-hidden"
      aria-labelledby="mm-hero-title"
    >
      <div className="mm-hero-overlay" aria-hidden />

      {/* Floating butterflies */}
      <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
        <Butterfly className="mm-butterfly-float absolute left-[8%] top-[18%] h-10 w-10 text-[var(--mm-pink)] opacity-55" />
        <Butterfly className="mm-butterfly-float mm-butterfly-float-delay-1 absolute right-[12%] top-[28%] h-7 w-7 text-[var(--mm-yellow)] opacity-50" />
        <Butterfly className="mm-butterfly-float mm-butterfly-float-delay-2 absolute left-[20%] top-[58%] h-8 w-8 text-[var(--mm-violet)] opacity-45" />
        <Butterfly className="mm-butterfly-float mm-butterfly-float-delay-3 absolute right-[20%] top-[62%] h-6 w-6 text-[var(--mm-pink)] opacity-45" />
        <Butterfly className="mm-butterfly-float absolute right-[6%] top-[14%] h-5 w-5 text-[var(--mm-blue)] opacity-40" />
      </div>

      <div className="mm-hero-content relative z-[5] mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-center px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] sm:py-20">
        {tagline ? (
          <span className="mb-4 inline-block font-[family-name:var(--font-mm-accent)] text-xl text-[var(--mm-yellow)] drop-shadow-[0_1px_2px_rgb(0_0_0_/0.7)] sm:text-2xl">
            {tagline}
          </span>
        ) : null}
        <h1
          id="mm-hero-title"
          className="mm-hero-title max-w-xl text-balance font-[family-name:var(--font-mm-display)] text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {t("hero.title")}
        </h1>
        <p className="mm-hero-subtitle mt-6 max-w-md text-lg font-medium leading-snug text-white/95 md:text-xl">
          {t("hero.subtitle")}
        </p>
        <Link
          href={`/${locale}/register`}
          className="mt-8 inline-flex min-h-[52px] w-fit max-w-full items-center justify-center gap-2 rounded-full bg-[var(--mm-blue)] px-8 py-3 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgb(47_125_190_/65%)] transition hover:bg-[var(--mm-blue-dark)]"
          aria-label={t("hero.ctaReservar")}
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
          {t("hero.ctaReservar")}
        </Link>
      </div>
    </section>
  );
}
