import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";

interface LandingHeroProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
}

export function LandingHero({
  dict,
  brand,
  locale,
  sessionEmail,
}: LandingHeroProps) {
  const heroTagline = taglineForLocale(brand, locale);

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-primary-dark)] text-[var(--color-primary-foreground)]">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-[var(--color-secondary)]/25 blur-3xl animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-[380px] w-[380px] rounded-full bg-[var(--color-accent)]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,transparent_0%,rgb(0_0_0_/12%)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/60 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[var(--layout-max-width)] px-4 pb-20 pt-16 md:pb-28 md:pt-24">
        <p className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)] md:text-sm">
          <Sparkles
            className="h-3.5 w-3.5 shrink-0 opacity-90 md:h-4 md:w-4"
            aria-hidden
            strokeWidth={1.75}
          />
          {dict.landing.hero.kicker}
        </p>
        <h1 className="animate-fade-up animate-delay-1 font-display mx-auto max-w-4xl text-balance text-center leading-[1.1] tracking-tight md:leading-[1.08]">
          <span className="block text-4xl font-semibold md:text-6xl">
            {brand.name}
          </span>
          <span className="mt-5 block text-2xl font-normal leading-snug text-white/92 md:mt-6 md:text-3xl md:leading-snug">
            {heroTagline}
          </span>
        </h1>
        <div className="animate-fade-up animate-delay-3 mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={
              sessionEmail ? `/${locale}#niveles` : `/${locale}/login`
            }
            className="group inline-flex items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-accent)] px-8 py-4 text-base font-semibold text-[var(--color-accent-foreground)] shadow-[0_8px_30px_-6px_rgb(240_185_50_/50%)] transition duration-300 hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
          >
            <span>
              {sessionEmail
                ? dict.landing.hero.ctaSignedIn
                : dict.landing.hero.cta}
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
              aria-hidden
              strokeWidth={1.75}
            />
          </Link>
          {brand.socialWhatsapp ? (
            <a
              href={brand.socialWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-white/35 bg-white/5 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-[var(--color-accent)]/80 hover:bg-white/10"
            >
              <MessageCircle
                className="h-4 w-4 shrink-0 opacity-90"
                aria-hidden
                strokeWidth={1.75}
              />
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
