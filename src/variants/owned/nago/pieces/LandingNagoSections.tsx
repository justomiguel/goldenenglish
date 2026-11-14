import Link from "next/link";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_HERO_SLIDES, NAGO_TEMPLATE } from "@/variants/owned/nago/pieces/nagoTemplateImages";
import { NagoLandingGallery } from "@/variants/owned/nago/pieces/NagoLandingGallery";
import { LandingNagoFooter } from "@/variants/owned/nago/pieces/LandingNagoFooter";
import { NagoHeroMotion } from "@/variants/owned/nago/pieces/NagoHeroMotion";
import { LandingNagoPillars } from "@/variants/owned/nago/pieces/LandingNagoPillars";
import { LandingNagoPrograms } from "@/variants/owned/nago/pieces/LandingNagoPrograms";
import { LandingNagoExperience } from "@/variants/owned/nago/pieces/LandingNagoExperience";
import { LandingNagoMestre } from "@/variants/owned/nago/pieces/LandingNagoMestre";
import { LandingNagoHorarios } from "@/variants/owned/nago/pieces/LandingNagoHorarios";
import { LandingNagoAccion } from "@/variants/owned/nago/pieces/LandingNagoAccion";
import { LandingNagoTestimonials } from "@/variants/owned/nago/pieces/LandingNagoTestimonials";
import { LandingNagoConvert } from "@/variants/owned/nago/pieces/LandingNagoConvert";
import { NagoLandingLeadForm } from "@/variants/owned/nago/pieces/NagoLandingLeadForm";
import { NagoReveal } from "@/variants/owned/nago/pieces/NagoReveal";
import { NagoScrollRoot } from "@/variants/owned/nago/pieces/NagoScrollRoot";
import { NagoSplitWords } from "@/variants/owned/nago/pieces/NagoSplitWords";
import { NagoRegisterCtaButtons } from "@/variants/owned/nago/pieces/NagoRegisterCtaButtons";
import type { PublicRegisterCtaItem } from "@/lib/settings/publicRegisterCtaItems";

interface LandingNagoSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
  registerCtas?: PublicRegisterCtaItem[];
  sessionEmail?: string | null;
}

export function LandingNagoSections({
  dict,
  brand,
  locale,
  registerCtas = [],
  sessionEmail = null,
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
      <NagoLandingGallery dict={dict} />
      <LandingNagoTestimonials dict={dict} />
      <LandingNagoConvert dict={dict} locale={locale} registerCtas={registerCtas} />
      <section className="bg-[var(--nago-bg)] px-[max(1.25rem,env(safe-area-inset-left))] py-14 pe-[max(1.25rem,env(safe-area-inset-right))]">
        <NagoReveal>
          <NagoLandingLeadForm dict={dict} locale={locale} />
        </NagoReveal>
      </section>
      <LandingNagoFooter
        dict={dict}
        brand={brand}
        locale={locale}
        t={t}
        sessionEmail={sessionEmail}
      />
    </NagoScrollRoot>
  );
}
