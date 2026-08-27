import Image from "next/image";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NagoLandingGallery } from "@/components/organisms/NagoLandingGallery";
import { NagoLandingContactPanel } from "@/components/organisms/NagoLandingContactPanel";
import { LandingNagoFooter } from "@/components/organisms/LandingNagoFooter";
import { NagoReveal } from "@/components/organisms/NagoReveal";
import { NagoHeroMotion } from "@/components/organisms/NagoHeroMotion";

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
  mediaMap,
}: LandingNagoSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);
  const img = (section: "inicio" | "historia" | "modalidades" | "oferta", file: string) =>
    resolveLandingImageSrcForTheme("nago", section, file, mediaMap);

  const principles = ["respeto", "disciplina", "union", "cultura"] as const;

  return (
    <>
      <NagoHeroMotion photoSrc={img("inicio", "hero-chile.png")}>
        <p className="nago-hero-kicker">{brand.name}</p>
        <h1
          id="nago-hero-title"
          className="nago-hero-title max-w-4xl text-balance font-[family-name:var(--font-nago-display)] text-5xl font-semibold uppercase leading-[0.95] tracking-[0.12em] sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {t("hero.title")}
        </h1>
        <div className="nago-hero-rule" aria-hidden />
        <p className="nago-hero-subtitle mt-2 max-w-xl text-lg font-medium leading-snug tracking-[0.18em] uppercase md:text-xl">
          {t("hero.subtitle")}
        </p>
        <Link href={`/${locale}/register`} className="nago-btn mt-10">
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
          {dict.landing.hero.ctaReserveSpot}
        </Link>
      </NagoHeroMotion>

      <section className="nago-offer" aria-label={t("hero.tagline")}>
        <div className="nago-offer-ken" aria-hidden />
        <NagoReveal>
          <h2 className="nago-offer-title font-[family-name:var(--font-nago-display)] text-2xl font-semibold tracking-wide md:text-4xl">
            {t("hero.tagline")}
          </h2>
        </NagoReveal>
      </section>

      <section
        id="sobre"
        className="nago-section-beige scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <NagoReveal>
            <h2 className="font-[family-name:var(--font-nago-display)] text-3xl font-semibold uppercase tracking-[0.08em] text-[var(--nago-heading-solid)] md:text-4xl">
              {t("sobreNosotros.title")}
            </h2>
            <div className="nago-rule-soft mt-4 h-0.5 w-12 bg-[var(--nago-green)]" aria-hidden />
            <p className="mt-5 text-pretty leading-relaxed text-[var(--nago-ink-muted)]">
              {t("sobreNosotros.bodyP1")}
            </p>
            <p className="mt-4 text-pretty leading-relaxed text-[var(--nago-ink-muted)]">
              {t("sobreNosotros.bodyP2")}
            </p>
          </NagoReveal>
          <NagoReveal delay={2} variant="media" className="rounded-2xl">
            <Image
              src={img("historia", "1.png")}
              alt=""
              width={720}
              height={540}
              className="h-full w-full object-cover"
            />
          </NagoReveal>
        </div>
      </section>

      <section
        id="principios"
        className="scroll-mt-24 bg-[var(--nago-bg)] px-[max(1.5rem,env(safe-area-inset-left))] py-16 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-20"
      >
        <NagoReveal>
          <h2 className="text-center font-[family-name:var(--font-nago-display)] text-3xl font-semibold uppercase tracking-[0.18em] text-[var(--nago-heading-solid)] md:text-4xl">
            {t("principios.sectionTitle")}
          </h2>
        </NagoReveal>
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {principles.map((key, i) => (
            <NagoReveal
              key={key}
              as="article"
              delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}
              className="nago-principle-item"
            >
              <h3 className="font-[family-name:var(--font-nago-display)] text-sm font-semibold uppercase tracking-[0.2em] text-[var(--nago-gold)]">
                {t(`principios.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nago-ink-muted)]">
                {t(`principios.${key}.body`)}
              </p>
            </NagoReveal>
          ))}
        </div>
      </section>

      <NagoLandingGallery dict={dict} />

      <section
        id="cta"
        className="scroll-mt-24 bg-[var(--nago-bg-2)] px-[max(1.5rem,env(safe-area-inset-left))] py-14 pb-[max(3rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] text-center md:py-16 md:pb-[max(4rem,env(safe-area-inset-bottom))]"
      >
        <NagoReveal>
          <h2 className="font-[family-name:var(--font-nago-display)] text-2xl font-semibold uppercase tracking-[0.14em] text-[var(--nago-heading-solid)] md:text-3xl lg:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--nago-ink-muted)] md:text-base">
            {t("cta.subtitle")}
          </p>
        </NagoReveal>
        <NagoLandingContactPanel dict={dict} locale={locale} />
      </section>
      <LandingNagoFooter dict={dict} brand={brand} locale={locale} t={t} />
    </>
  );
}
