import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Music2, Plane, Sparkles } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeKind } from "@/types/theming";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import {
  marketingLandingCopy,
  marketingLandingParagraphs,
} from "@/lib/landing/mzLandingCopy";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";
import { MozarthitosBioTabs } from "@/components/organisms/MozarthitosBioTabs";
import { LandingMozarthitosLowerSections } from "@/components/organisms/LandingMozarthitosLowerSections";

export interface LandingMozarthitosSectionsProps {
  dict: Dictionary;
  locale: string;
  mediaMap?: LandingMediaMap;
  marketingBrand?: MarketingLandingBrand;
  imageThemeKind?: SiteThemeKind;
}

export function LandingMozarthitosSections({
  dict,
  locale,
  mediaMap,
  marketingBrand = "mz",
  imageThemeKind = "mozarthitos",
}: LandingMozarthitosSectionsProps) {
  const brand = marketingBrand;
  const img = (section: "inicio" | "historia" | "oferta", file: string) =>
    resolveLandingImageSrcForTheme(imageThemeKind, section, file, mediaMap);

  const felipeParas = marketingLandingParagraphs(dict, brand, "bio.felipe", 6);
  const janeParas = marketingLandingParagraphs(dict, brand, "bio.jane", 3);
  const mapSrc = marketingLandingCopy(dict, brand, "map.embedSrc").trim();
  const igUrl = marketingLandingCopy(dict, brand, "contact.instagramUrl").trim();

  return (
    <>
      <section
        className="relative isolate z-[2] min-h-[min(100dvh,920px)] overflow-hidden text-white mz-hero-surface sm:min-h-[78vh] md:min-h-[88vh]"
        aria-labelledby="mz-hero-title"
      >
        <div className="relative z-[1] mx-auto flex max-w-6xl flex-col gap-10 px-[max(1rem,env(safe-area-inset-left))] pb-[max(6rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,env(safe-area-inset-top)+4rem)] sm:gap-12 sm:pb-28 sm:pt-28 md:flex-row md:items-end md:justify-between md:gap-10 md:pb-36 md:pt-32 lg:gap-16 lg:px-6">
          <MozarthitosReveal
            preset="heroTitle"
            eager
            className="order-2 min-w-0 max-w-xl md:order-1 md:pb-6"
          >
            <div className="mz-hero-title-card px-4 py-6 sm:px-6 sm:py-7 md:px-8 md:py-9">
              <h1
                id="mz-hero-title"
                className="text-balance text-[clamp(1.45rem,4.6vw+0.65rem,3.1rem)] leading-[1.06] md:leading-[1.08]"
              >
                {marketingLandingCopy(dict, brand, "hero.title")}
              </h1>
              <p className="mt-4 border-l-[4px] border-[var(--mz-yellow)] pl-3 text-sm font-semibold leading-relaxed text-white/95 sm:mt-5 sm:border-l-[5px] sm:pl-4 sm:text-base md:mt-6 md:pl-5 md:text-lg">
                {marketingLandingCopy(dict, brand, "hero.subtitle")}
              </p>
              <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-7 sm:max-w-none sm:flex-row sm:flex-wrap md:mt-8">
                <Link
                  href={`/${locale}#quienes`}
                  className="inline-flex min-h-[48px] w-full flex-1 items-center justify-center gap-2 rounded-full bg-[var(--mz-yellow)] px-5 py-3 text-sm font-bold text-[var(--mz-ink-on-white)] shadow-[0_10px_28px_rgb(0_0_0_/28%)] transition-colors hover:bg-[var(--mz-yellow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:min-w-[11rem]"
                >
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                  {marketingLandingCopy(dict, brand, "hero.ctaPrimary")}
                </Link>
                <Link
                  href={`/${locale}#contacto`}
                  className="inline-flex min-h-[48px] w-full flex-1 items-center justify-center gap-2 rounded-full border-2 border-white/80 bg-white/12 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:min-w-[11rem]"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                  {marketingLandingCopy(dict, brand, "hero.ctaSecondary")}
                </Link>
              </div>
            </div>
          </MozarthitosReveal>
          <MozarthitosReveal
            preset="heroImage"
            eager
            className="order-1 flex w-full justify-center px-1 md:order-2 md:w-auto md:max-w-[42%] md:justify-end md:px-0 md:pb-2 lg:max-w-none"
          >
            <div className="mz-hero-photo-frame mx-auto w-full max-w-[min(100%,288px)] sm:max-w-[min(100%,300px)] md:mx-0 md:max-w-none">
              <Image
                src={img("inicio", "2.png")}
                alt=""
                width={520}
                height={520}
                className="aspect-square w-full rounded-[22px] object-cover sm:rounded-[24px] md:h-[min(32vw,320px)] md:w-[min(32vw,320px)] md:rounded-[28px]"
                sizes="(max-width: 768px) min(288px, 100vw), (max-width: 1280px) 32vw, 320px"
                priority
              />
            </div>
          </MozarthitosReveal>
        </div>
      </section>

      <section
        id="quienes"
        className="mz-quienes-section relative z-[10] -mt-12 scroll-mt-[max(6rem,env(safe-area-inset-top)+5rem)] rounded-t-[28px] px-[max(1rem,env(safe-area-inset-left))] pb-[max(4rem,env(safe-area-inset-bottom))] pt-10 shadow-[0_-30px_70px_rgb(0_0_0_/18%)] sm:-mt-16 sm:rounded-t-[40px] sm:pb-16 sm:pt-12 md:-mt-24 md:rounded-t-[52px] md:pb-28 md:pt-16 lg:px-6"
      >
        <div className="relative z-[2] mx-auto max-w-6xl">
          <MozarthitosReveal preset="quienesHeading" className="mb-10 md:mb-16">
            <div className="mz-quienes-ribbon inline-flex w-full max-w-full px-4 py-2.5 sm:w-auto sm:px-5 sm:py-3 md:px-8 md:py-4">
              <h2 className="mz-section-heading text-pretty text-xl text-[var(--mz-white)] sm:text-2xl md:text-4xl lg:text-5xl">
                {marketingLandingCopy(dict, brand, "quienes.title")}
              </h2>
            </div>
          </MozarthitosReveal>
          <div className="grid gap-10 sm:gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="mz-story-stack space-y-10 lg:col-span-7">
              <MozarthitosReveal preset="origenesCard">
                <article className="mz-story-card">
                  <div className="flex gap-4 md:gap-5">
                    <div
                      className="mz-story-icon flex h-14 w-14 shrink-0 items-center justify-center md:h-16 md:w-16"
                      aria-hidden
                    >
                      <Music2 className="h-7 w-7 md:h-8 md:w-8" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h3 className="text-lg font-semibold text-[var(--mz-white)] md:text-xl">
                        {marketingLandingCopy(dict, brand, "origenes.title")}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--mz-white)]/92 md:text-base">
                        {marketingLandingCopy(dict, brand, "origenes.body")}
                      </p>
                    </div>
                  </div>
                </article>
              </MozarthitosReveal>
              <MozarthitosReveal preset="llegadaCard">
                <article className="mz-story-card">
                  <div className="flex gap-4 md:gap-5">
                    <div
                      className="mz-story-icon flex h-14 w-14 shrink-0 items-center justify-center md:h-16 md:w-16"
                      aria-hidden
                    >
                      <Plane className="h-7 w-7 md:h-8 md:w-8" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h3 className="text-lg font-semibold text-[var(--mz-white)] md:text-xl">
                        {marketingLandingCopy(dict, brand, "llegada.title")}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--mz-white)]/92 md:text-base">
                        {marketingLandingCopy(dict, brand, "llegada.body")}
                      </p>
                    </div>
                  </div>
                </article>
              </MozarthitosReveal>
              <MozarthitosReveal preset="bioTabs">
                <MozarthitosBioTabs
                  surface="onPink"
                  tabFelipe={marketingLandingCopy(dict, brand, "tab.felipe")}
                  tabJane={marketingLandingCopy(dict, brand, "tab.jane")}
                  felipePortraitSrc={img("historia", "2.png")}
                  janePortraitSrc={img("historia", "3.png")}
                  felipeParagraphs={felipeParas}
                  janeParagraphs={janeParas}
                />
              </MozarthitosReveal>
            </div>
            <MozarthitosReveal
              preset="bioPortrait"
              className="flex justify-center lg:col-span-5 lg:justify-end"
            >
              <div className="mz-bio-portrait-frame w-full max-w-md lg:sticky lg:top-28 lg:max-w-none">
                <Image
                  src={img("historia", "1.png")}
                  alt=""
                  width={692}
                  height={1024}
                  className="mx-auto max-h-[min(72svh,620px)] w-full rounded-[20px] object-cover sm:rounded-[24px] md:rounded-[28px]"
                  sizes="(max-width: 1024px) min(100vw-2rem, 420px), 40vw"
                />
              </div>
            </MozarthitosReveal>
          </div>
        </div>
      </section>

      <LandingMozarthitosLowerSections
        dict={dict}
        locale={locale}
        imgOferta={(file) => img("oferta", file)}
        mapSrc={mapSrc}
        igUrl={igUrl}
        marketingBrand={brand}
      />
    </>
  );
}
