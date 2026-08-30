import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_HERO_SLIDES, NAGO_TEMPLATE } from "@/lib/landing/nagoTemplateImages";
import { NagoLandingGallery } from "@/components/organisms/NagoLandingGallery";
import { LandingNagoFooter } from "@/components/organisms/LandingNagoFooter";
import { NagoHeroMotion } from "@/components/organisms/NagoHeroMotion";
import { LandingNagoPillars } from "@/components/organisms/LandingNagoPillars";
import { LandingNagoPrograms } from "@/components/organisms/LandingNagoPrograms";
import { LandingNagoExperience } from "@/components/organisms/LandingNagoExperience";
import { LandingNagoMestre } from "@/components/organisms/LandingNagoMestre";
import { LandingNagoHorarios } from "@/components/organisms/LandingNagoHorarios";
import { LandingNagoAccion } from "@/components/organisms/LandingNagoAccion";
import { LandingNagoEvents } from "@/components/organisms/LandingNagoEvents";
import { LandingNagoTestimonials } from "@/components/organisms/LandingNagoTestimonials";
import { LandingNagoConvert } from "@/components/organisms/LandingNagoConvert";
import { NagoLandingLeadForm } from "@/components/organisms/NagoLandingLeadForm";

interface LandingNagoSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
}

export function LandingNagoSections({
  dict,
  brand,
  locale,
}: LandingNagoSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <>
      <NagoHeroMotion
        photoSrc={NAGO_TEMPLATE.hero}
        photoSrcs={NAGO_HERO_SLIDES}
        slidePrevLabel={t("hero.slidePrev")}
        slideNextLabel={t("hero.slideNext")}
        slideGoToLabel={t("hero.slideGoTo")}
        discover={
          <a href={`/${locale}#clases`} className="nago-hero-discover">
            <span>{t("hero.discover")}</span>
            <span className="nago-hero-discover-arrow" aria-hidden />
          </a>
        }
      >
        <h1
          id="nago-hero-title"
          className="nago-hero-title nago-display max-w-4xl text-5xl leading-[0.9] sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {t("hero.title")}{" "}
          <span className="nago-hero-title-accent">{t("hero.titleAccent")}</span>
        </h1>
        <div className="nago-hero-rule" aria-hidden />
        <p className="nago-hero-subtitle mt-1 max-w-xl text-sm font-medium uppercase sm:text-base md:text-lg">
          {t("hero.subtitle")}
          <span className="mt-1 block">{t("hero.subtitleTrail")}</span>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={`/${locale}/register`} className="nago-btn nago-btn-solid">
            {t("hero.ctaPrimary")}
          </Link>
          <Link href={`/${locale}#nago`} className="nago-btn">
            {t("hero.ctaSecondary")}
          </Link>
        </div>
      </NagoHeroMotion>

      <LandingNagoPillars dict={dict} />
      <LandingNagoPrograms dict={dict} locale={locale} />
      <LandingNagoExperience dict={dict} />
      <LandingNagoMestre dict={dict} locale={locale} />
      <LandingNagoHorarios dict={dict} locale={locale} />
      <LandingNagoAccion dict={dict} />
      <LandingNagoEvents dict={dict} locale={locale} />
      <NagoLandingGallery dict={dict} />
      <LandingNagoTestimonials dict={dict} />
      <LandingNagoConvert dict={dict} locale={locale} />
      <section className="bg-[var(--nago-bg)] px-[max(1.25rem,env(safe-area-inset-left))] py-14 pe-[max(1.25rem,env(safe-area-inset-right))]">
        <NagoLandingLeadForm dict={dict} locale={locale} />
      </section>
      <LandingNagoFooter dict={dict} brand={brand} locale={locale} t={t} />
    </>
  );
}
