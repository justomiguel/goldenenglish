import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { EspacioZenitHeroSplash } from "@/components/molecules/EspacioZenitHeroSplash";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";

export interface LandingEspacioZenitHeroMockupProps {
  dict: Dictionary;
  locale: string;
  logoSrc: string;
  logoAlt: string;
}

export function LandingEspacioZenitHeroMockup({
  dict,
  locale,
  logoSrc,
  logoAlt,
}: LandingEspacioZenitHeroMockupProps) {
  const brand = "ez" as const;
  const prefix = `/${locale}`;
  const heroLeftFigureSrc = "/images/espaciozenit/landing/1.png";
  const heroRightFigureSrc = "/images/espaciozenit/landing/2.png";
  const heroFigureAlt = marketingLandingCopy(dict, brand, "placeholders.heroFigure");
  const heroRightFigureAlt =
    marketingLandingCopy(dict, brand, "disciplinas.ballet.title").trim() ||
    heroFigureAlt;

  return (
    <section
      className="ez-mock-hero relative isolate z-[2] overflow-hidden bg-black pb-14 pt-8 text-white md:pb-20 md:pt-12"
      aria-labelledby="ez-mock-hero-visually-hidden-title"
    >
      <span id="ez-mock-hero-visually-hidden-title" className="sr-only">
        {marketingLandingCopy(dict, brand, "hero.tagline")}
      </span>
      <div className="pointer-events-none absolute inset-0 ez-mock-hero-texture" aria-hidden />
      <div className="pointer-events-none absolute inset-0 ez-mock-hero-scribbles opacity-[0.12]" aria-hidden />

      <div className="relative z-[1] mx-auto grid max-w-6xl gap-10 px-[max(1rem,env(safe-area-inset-left))] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.12fr)_minmax(0,1.2fr)] lg:items-center lg:gap-5 lg:px-6 xl:gap-8">
        <MozarthitosReveal
          preset="heroImage"
          eager
          className="flex justify-center lg:justify-end lg:pe-2"
        >
          <div className="ez-mock-dancer-card ez-mock-dancer-card--left flex w-full justify-center lg:justify-end">
            <EspacioZenitHeroSplash variant="left" />
            <div className="ez-mock-dancer-img-layer w-full max-w-[min(500px,94vw)] lg:max-w-none">
              <Image
                src={heroLeftFigureSrc}
                alt={heroFigureAlt}
                width={1122}
                height={1402}
                className="h-auto w-full object-contain object-bottom"
                sizes="(max-width: 1023px) min(500px, 94vw), (max-width: 1280px) 38vw, 450px"
                priority
              />
            </div>
          </div>
        </MozarthitosReveal>

        <div className="flex flex-col items-center text-center">
          <MozarthitosReveal preset="heroTitle" eager className="w-full">
            <div className="space-y-1 md:space-y-2">
              <p className="ez-mock-brush ez-mock-hero-brush ez-mock-brush--white text-[clamp(2.75rem,8vw,4.75rem)] leading-[0.95]">
                {marketingLandingCopy(dict, brand, "hero.brushLine1")}
              </p>
              <p className="ez-mock-brush ez-mock-hero-brush ez-mock-brush--cyan text-[clamp(2.35rem,7vw,4rem)] leading-[0.98]">
                {marketingLandingCopy(dict, brand, "hero.brushLine2")}
              </p>
            </div>
            <p className="mt-6 max-w-xl px-2 text-sm font-semibold uppercase tracking-[0.22em] text-white/88 md:text-base">
              {marketingLandingCopy(dict, brand, "hero.tagline")}
            </p>
            <div className="mx-auto mt-8 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt={logoAlt}
                width={120}
                height={120}
                decoding="async"
                className="h-[92px] w-[92px] rounded-full border-[3px] border-[var(--ez-cyan)] bg-black object-contain p-2 shadow-[0_0_48px_rgb(0_174_239_/35%)] md:h-[112px] md:w-[112px]"
              />
            </div>
          </MozarthitosReveal>

          <MozarthitosReveal preset="origenesCard" eager className="mt-10 w-full max-w-xl px-1">
            <div
              id="nosotros"
              className="scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] space-y-4 rounded-2xl border border-[rgb(255_255_255_/10%)] bg-black/35 px-5 py-6 backdrop-blur-sm md:px-8 md:py-8"
            >
              <p className="text-sm leading-relaxed text-white/82 md:text-base">
                {marketingLandingCopy(dict, brand, "hero.introBody")}
              </p>
              <div className="mx-auto h-1 max-w-[min(100%,240px)] rounded-full bg-[var(--ez-cyan)] opacity-90 ez-mock-brush-rule" />
              <Link
                href={`${prefix}#contacto`}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/18 md:text-sm"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                {marketingLandingCopy(dict, brand, "hero.ctaSecondary")}
              </Link>
            </div>
          </MozarthitosReveal>
        </div>

        <MozarthitosReveal
          preset="heroImage"
          eager
          className="flex justify-center lg:justify-start lg:ps-2"
        >
          <div className="ez-mock-dancer-card ez-mock-dancer-card--right flex w-full justify-center lg:justify-start">
            <EspacioZenitHeroSplash variant="right" />
            <div className="ez-mock-dancer-img-layer w-full max-w-[min(500px,94vw)] lg:max-w-none">
              <Image
                src={heroRightFigureSrc}
                alt={heroRightFigureAlt}
                width={1024}
                height={1536}
                className="h-auto w-full object-contain object-bottom"
                sizes="(max-width: 1023px) min(500px, 94vw), (max-width: 1280px) 38vw, 450px"
                priority
              />
            </div>
          </div>
        </MozarthitosReveal>
      </div>
    </section>
  );
}
