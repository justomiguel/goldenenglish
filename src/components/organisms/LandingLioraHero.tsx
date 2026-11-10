import Link from "next/link";
import { CalendarClock, UserPlus } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";
import { landingRegisterCtasFromDict } from "@/lib/settings/landingRegisterCtasFromDict";
import { LandingHeroPhoto } from "@/components/molecules/LandingHeroPhoto";
import { LioraSectionHeading } from "@/components/molecules/LioraSectionHeading";

interface LandingLioraHeroProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  t: (path: string) => string;
  heroSrc: string;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

const CTA_BASE =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-7 py-3 text-xs font-medium uppercase tracking-[0.2em]";

export function LandingLioraHero({
  dict,
  brand,
  locale,
  t,
  heroSrc,
  publicCtaMode,
  inscriptionsEnabled,
}: LandingLioraHeroProps) {
  const logo = brand.logoPath.trim();
  const ctas = landingRegisterCtasFromDict({ locale, dict, publicCtaMode, inscriptionsEnabled });

  return (
    <section
      className="liora-hero"
      aria-labelledby="liora-hero-title"
      data-liora-anchor="hero"
      data-liora-side="start"
    >
      <div className="absolute inset-0" aria-hidden>
        <LandingHeroPhoto
          src={heroSrc}
          alt=""
          sizes="100vw"
          priority
          className="object-cover object-[70%_center]"
        />
      </div>
      <div className="liora-hero-overlay" aria-hidden />
      <div className="liora-hero-content mx-auto flex min-h-[82vh] max-w-6xl flex-col justify-end px-[max(1.5rem,env(safe-area-inset-left))] pb-16 pt-40 pe-[max(1.5rem,env(safe-area-inset-right))] lg:justify-center lg:py-24">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- local + Storage URLs
          <img
            src={logo}
            alt={brand.logoAlt || brand.name}
            width={112}
            height={112}
            decoding="async"
            className="mb-6 h-20 w-20 object-contain md:h-24 md:w-24"
          />
        ) : null}
        <LioraSectionHeading
          as="h1"
          id="liora-hero-title"
          size="hero"
          align="start"
          title={t("hero.title")}
          script={t("hero.titleScript")}
        />
        <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-[var(--liora-ink)] md:text-xl">
          {t("hero.subtitle")}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          {ctas.map((cta) => (
            <Link key={cta.intent} href={cta.href} className={`liora-btn-solid ${CTA_BASE}`}>
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
              {cta.label}
            </Link>
          ))}
          <Link href={`/${locale}#horarios`} className={`liora-btn-outline bg-[var(--liora-cream)] ${CTA_BASE}`}>
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
            {t("hero.ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
