import Image from "next/image";
import Link from "next/link";
import { CalendarHeart, Flower2, Sparkles, UserPlus } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LandingLioraClasesSection } from "@/components/organisms/LandingLioraClasesSection";
import { LandingLioraSedesSection } from "@/components/organisms/LandingLioraSedesSection";
import { LandingLioraHorariosSection } from "@/components/organisms/LandingLioraHorariosSection";
import { LioraLandingGallery } from "@/components/organisms/LioraLandingGallery";
import { LioraLandingContactPanel } from "@/components/organisms/LioraLandingContactPanel";
import { LandingLioraFooter } from "@/components/organisms/LandingLioraFooter";
import { LandingHeroPhoto } from "@/components/molecules/LandingHeroPhoto";

interface LandingLioraSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
}

const PILLARS = [
  { key: "pilar1", Icon: Flower2 },
  { key: "pilar2", Icon: Sparkles },
  { key: "pilar3", Icon: CalendarHeart },
] as const;

export function LandingLioraSections({
  dict,
  brand,
  locale,
  mediaMap,
}: LandingLioraSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "liora", path);
  const img = (
    section: "inicio" | "historia" | "modalidades" | "oferta",
    file: string,
  ) => resolveLandingImageSrcForTheme("liora", section, file, mediaMap);

  return (
    <>
      {/* Hero */}
      <section
        className="liora-hero relative isolate"
        aria-labelledby="liora-hero-title"
      >
        <div className="absolute inset-0" aria-hidden>
          <LandingHeroPhoto
            src={img("inicio", "1.jpg")}
            alt=""
            sizes="100vw"
            priority
            className="object-cover object-[center_30%]"
          />
        </div>
        <div className="liora-hero-overlay" aria-hidden />
        <div className="liora-hero-content mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))]">
          <p className="liora-kicker text-[var(--liora-blush)]">
            {t("hero.kicker")}
          </p>
          <h1
            id="liora-hero-title"
            className="mt-6 max-w-2xl text-balance font-[family-name:var(--font-liora-display)] text-5xl font-light leading-[1.05] tracking-[0.06em] text-white sm:text-6xl md:text-7xl"
          >
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-lg text-lg font-light leading-relaxed text-white/90 md:text-xl">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/register`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[var(--liora-cream)] px-8 py-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--liora-ink)] transition hover:bg-white"
            >
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
              {t("hero.ctaPrimary")}
            </Link>
            <Link
              href={`/${locale}#horarios`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/70 px-8 py-3 text-xs font-medium uppercase tracking-[0.22em] text-white transition hover:bg-white/12"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Sobre nosotros */}
      <section
        id="sobre"
        className="liora-band-cream scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))] md:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="liora-kicker text-[var(--liora-rose-deep)]">
              {t("sobreNosotros.kicker")}
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-liora-display)] text-4xl font-light tracking-[0.1em] text-[var(--liora-ink)] md:text-5xl">
              {t("sobreNosotros.title")}
            </h2>
            <p className="mt-6 text-pretty leading-relaxed text-[var(--liora-ink-soft)]">
              {t("sobreNosotros.bodyP1")}
            </p>
            <p className="mt-4 text-pretty leading-relaxed text-[var(--liora-ink-soft)]">
              {t("sobreNosotros.bodyP2")}
            </p>

            <dl className="mt-10 grid gap-6 sm:grid-cols-3">
              {PILLARS.map(({ key, Icon }) => (
                <div key={key}>
                  <Icon
                    className="h-7 w-7 text-[var(--liora-rose-deep)]"
                    aria-hidden
                    strokeWidth={1.25}
                  />
                  <dt className="mt-3 font-[family-name:var(--font-liora-display)] text-lg tracking-wide text-[var(--liora-ink)]">
                    {t(`sobreNosotros.${key}.title`)}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-[var(--liora-ink-soft)]">
                    {t(`sobreNosotros.${key}.body`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="liora-arch relative aspect-[3/4] w-full max-w-sm">
              <Image
                src={img("historia", "1.jpg")}
                alt=""
                width={480}
                height={640}
                className="h-full w-full object-cover"
                sizes="(max-width:1024px) 90vw, 384px"
              />
            </div>
          </div>
        </div>
      </section>

      <LandingLioraClasesSection t={t} img={img} />

      <LandingLioraSedesSection t={t} img={img} />

      <LandingLioraHorariosSection t={t} />

      <LioraLandingGallery dict={dict} />

      {/* CTA + contacto */}
      <section
        id="cta"
        className="liora-band-cream scroll-mt-24 border-t border-[var(--liora-line)] px-[max(1.5rem,env(safe-area-inset-left))] py-20 pb-[max(3rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] text-center md:py-24"
      >
        <h2 className="font-[family-name:var(--font-liora-display)] text-3xl font-light tracking-[0.1em] text-[var(--liora-ink)] md:text-4xl lg:text-5xl">
          {t("cta.title")}
        </h2>
        <div className="liora-flourish mt-5" aria-hidden />
        <p className="mx-auto mt-6 max-w-2xl text-pretty leading-relaxed text-[var(--liora-ink-soft)]">
          {t("cta.subtitle")}
        </p>
        <LioraLandingContactPanel dict={dict} locale={locale} />
      </section>

      <LandingLioraFooter dict={dict} brand={brand} locale={locale} t={t} />
    </>
  );
}
