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
import { NagoReveal } from "@/components/organisms/NagoReveal";
import { NagoScrollRoot } from "@/components/organisms/NagoScrollRoot";
import { NagoSplitWords } from "@/components/organisms/NagoSplitWords";
import { NagoRegisterCtaButtons } from "@/components/molecules/NagoRegisterCtaButtons";
import type { PublicRegisterCtaItem } from "@/lib/settings/publicRegisterCtaItems";

interface LandingNagoSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
  registerCtas?: PublicRegisterCtaItem[];
}

export function LandingNagoSections({
  dict,
  brand,
  locale,
  registerCtas = [],
}: LandingNagoSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <NagoScrollRoot>
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
        <NagoSplitWords
          id="nago-hero-title"
          className="nago-hero-title nago-display max-w-4xl text-5xl leading-[0.9] sm:text-6xl md:text-7xl lg:text-8xl"
          parts={[
            { text: t("hero.title") },
            { text: t("hero.titleAccent"), accent: true },
          ]}
        />
        <div className="nago-hero-rule" aria-hidden />
        <p className="nago-hero-subtitle mt-1 max-w-xl text-sm font-medium uppercase sm:text-base md:text-lg">
          {t("hero.subtitle")}
          <span className="mt-1 block">{t("hero.subtitleTrail")}</span>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {registerCtas.length > 0 ? (
            <NagoRegisterCtaButtons items={registerCtas} className="flex flex-col gap-3 sm:flex-row" />
          ) : (
            <Link href={`/${locale}/register`} className="nago-btn nago-btn-solid">
              {t("hero.ctaPrimary")}
            </Link>
          )}
          <Link href={`/${locale}#nago`} className="nago-btn">
            {t("hero.ctaSecondary")}
          </Link>
        </div>
      </NagoHeroMotion>

      <LandingNagoPillars dict={dict} />
      <LandingNagoPrograms dict={dict} locale={locale} />
      <LandingNagoExperience dict={dict} />
      <LandingNagoMestre dict={dict} locale={locale} />
      <LandingNagoHorarios dict={dict} locale={locale} registerCtas={registerCtas} />
      <LandingNagoAccion dict={dict} />
      <LandingNagoEvents dict={dict} locale={locale} />
      <NagoLandingGallery dict={dict} />
      <LandingNagoTestimonials dict={dict} />
      <LandingNagoConvert dict={dict} locale={locale} registerCtas={registerCtas} />
      <section className="bg-[var(--nago-bg)] px-[max(1.25rem,env(safe-area-inset-left))] py-14 pe-[max(1.25rem,env(safe-area-inset-right))]">
        <NagoReveal>
          <NagoLandingLeadForm dict={dict} locale={locale} />
        </NagoReveal>
      </section>
      <LandingNagoFooter dict={dict} brand={brand} locale={locale} t={t} />
    </NagoScrollRoot>
  );
}
