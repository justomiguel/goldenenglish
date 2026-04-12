import { MessageCircle, Sparkles } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import { taglineForLocale } from "@/lib/brand/taglineForLocale";
import { LandingHeroInscriptionCta } from "@/components/molecules/LandingHeroInscriptionCta";
import { LandingTiltedPhoto } from "@/components/molecules/LandingTiltedPhoto";
import {
  INICIO_IMAGES,
  sectionImageSrc,
} from "@/lib/landing/sectionLandingImages";

interface LandingHeroProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  inscriptionsOpen: boolean;
}

export function LandingHero({
  dict,
  brand,
  locale,
  sessionEmail,
  inscriptionsOpen,
}: LandingHeroProps) {
  const heroTagline = taglineForLocale(brand, locale);
  const shots = dict.landing.collage.alts;

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

      <div
        className="landing-hero-bubble-texture pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-soft-light"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[var(--layout-max-width)] px-4 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-14">
          <div className="text-center lg:text-left">
            <p className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)] md:text-sm lg:mx-0">
              <Sparkles
                className="h-3.5 w-3.5 shrink-0 opacity-90 md:h-4 md:w-4"
                aria-hidden
                strokeWidth={1.75}
              />
              {dict.landing.hero.kicker}
            </p>
            <h1 className="animate-fade-up animate-delay-1 font-display mx-auto max-w-4xl text-balance leading-[1.1] tracking-tight md:leading-[1.08] lg:mx-0">
              <span className="block text-4xl font-semibold md:text-6xl">
                {brand.name}
              </span>
              <span className="mt-5 block text-2xl font-normal leading-snug text-white/92 md:mt-6 md:text-3xl md:leading-snug">
                {heroTagline}
              </span>
            </h1>
            <div className="animate-fade-up animate-delay-3 mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-5 lg:justify-start">
              {sessionEmail || inscriptionsOpen ? (
                <LandingHeroInscriptionCta
                  href={
                    sessionEmail ? `/${locale}#niveles` : `/${locale}/register`
                  }
                  label={
                    sessionEmail
                      ? dict.landing.hero.ctaSignedIn
                      : dict.landing.hero.ctaRegister
                  }
                  mode={sessionEmail ? "signedIn" : "register"}
                />
              ) : null}
              {brand.socialWhatsapp ? (
                <a
                  href={brand.socialWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/wa relative inline-flex max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary-dark)]"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-0.5 rounded-[calc(var(--layout-border-radius)+6px)] bg-white/15 blur-md opacity-60 transition group-hover/wa:opacity-100"
                  />
                  <span className="relative flex min-h-[3.25rem] items-center gap-3 overflow-hidden rounded-[var(--layout-border-radius)] border border-white/40 bg-gradient-to-b from-white/18 to-white/[0.07] px-2 py-2 pl-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.12),0_6px_0_0_rgba(0,0,0,0.18),0_14px_36px_-14px_rgba(0,0,0,0.45)] backdrop-blur-md transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-[var(--color-accent)]/50 motion-safe:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_0_0_rgba(0,0,0,0.2),0_18px_40px_-12px_rgba(0,0,0,0.4)] motion-safe:active:translate-y-0">
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--layout-border-radius)-2px)] bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                    >
                      <MessageCircle
                        className="h-5 w-5 text-white drop-shadow"
                        strokeWidth={1.85}
                        aria-hidden
                      />
                    </span>
                    <span className="pr-4">{dict.landing.hero.whatsappCta}</span>
                  </span>
                </a>
              ) : null}
            </div>

            <div className="mt-10 flex justify-center gap-4 md:hidden">
              <LandingTiltedPhoto
                src={sectionImageSrc("inicio", INICIO_IMAGES[0])}
                alt={shots[0] ?? ""}
                className="w-[44%] max-w-[11rem]"
                rotateClass="-rotate-5"
                sizes="44vw"
                priority
              />
              <LandingTiltedPhoto
                src={sectionImageSrc("inicio", INICIO_IMAGES[1])}
                alt={shots[1] ?? ""}
                className="w-[44%] max-w-[11rem] translate-y-5"
                rotateClass="rotate-6"
                sizes="44vw"
              />
            </div>
          </div>

          <div className="relative mx-auto hidden min-h-[300px] w-full max-w-md md:block lg:mx-0 lg:max-w-none lg:min-h-[360px]">
            <LandingTiltedPhoto
              src={sectionImageSrc("inicio", INICIO_IMAGES[0])}
              alt={shots[0] ?? ""}
              className="absolute left-0 top-10 w-[58%] lg:w-[54%]"
              rotateClass="-rotate-6"
              sizes="320px"
              priority
            />
            <LandingTiltedPhoto
              src={sectionImageSrc("inicio", INICIO_IMAGES[1])}
              alt={shots[1] ?? ""}
              className="absolute right-0 top-0 z-10 w-[56%] lg:w-[52%]"
              rotateClass="rotate-[7deg]"
              sizes="300px"
            />
            <LandingTiltedPhoto
              src={sectionImageSrc("inicio", INICIO_IMAGES[2])}
              alt={shots[2] ?? ""}
              className="absolute bottom-0 left-[14%] z-20 w-[52%] lg:left-[18%] lg:w-[48%]"
              rotateClass="rotate-[3deg]"
              sizes="280px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
