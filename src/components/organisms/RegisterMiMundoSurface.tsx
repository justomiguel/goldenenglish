import Image from "next/image";
import Link from "next/link";
import { Heart, LogIn, Sparkles, Sprout } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { resolveMiMundoRegisterDict } from "@/lib/register/resolveMiMundoRegisterDict";
import { RegisterForm } from "@/components/register/RegisterForm";
import { MiMundoRegisterHeader } from "@/components/molecules/MiMundoRegisterHeader";
import { MiMundoFontRoot } from "@/components/organisms/MiMundoFontRoot";
import { MiMundoFloatingDoodles } from "@/components/molecules/MiMundoFloatingDoodles";
import { MiMundoCursorTrail } from "@/components/molecules/MiMundoCursorTrail";
import { MiMundoButterflyTrails } from "@/components/molecules/MiMundoButterflyTrails";

export interface RegisterMiMundoSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
}

/**
 * Themed registration surface for the Mi Mundo tenant.
 *
 * Mirrors the landing's visual language (cream paper, watercolor blobs,
 * floating doodles, butterfly trails, brush-stroke title and rotated
 * stickers) so the journey from `/` → `/register` feels like one
 * world, not two. Inherits the Mimundo palette automatically because
 * `--color-*` CSS variables are document-scoped from `site_themes`.
 */
export function RegisterMiMundoSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
}: RegisterMiMundoSurfaceProps) {
  const prefix = `/${locale}`;
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);

  const figureKicker = t("register.figureKicker");
  const figureTitle = t("register.figureTitle");
  const figureLead = t("register.figureLead");
  const shellTitle = t("register.shellTitle");
  const shellLead = t("register.shellLead");
  const ctaCallout = t("register.ctaCallout");
  const loginCta = t("register.loginCta");
  const bulletPlay = t("register.figureBullets.play");
  const bulletNature = t("register.figureBullets.nature");
  const bulletCare = t("register.figureBullets.care");

  const registerDict = resolveMiMundoRegisterDict(dict.register, dict.landing.mm.register);

  const titleWords = figureTitle.split(/\s+/).filter(Boolean);

  // Mascot reuses the same logo asset rendered by the hero (`mm-mascot-bob`)
  // — `brand.logoPath` resolves to `/images/mimundo/logo/logo.png` per the
  // mimundo site_theme seed, so the journey from `/` to `/register` shows
  // the exact same mascot.
  const mascotSrc = brand.logoPath;

  return (
    <MiMundoFontRoot className="relative min-h-screen overflow-x-hidden">
      <MiMundoRegisterHeader
        locale={locale}
        logoSrc={brand.logoPath}
        logoAlt={brand.logoAlt || brand.name}
        dict={dict}
      />

      {/* Subtle mouse estela — same as landing, fixed full viewport */}
      <MiMundoCursorTrail />

      <div className="mm-register-canvas mm-section-decorated relative">
        {/* Watercolor backdrop — pink + yellow blobs echo the hero */}
        <div
          className="mm-section-blob mm-section-blob--pink absolute -left-[18%] top-[6%] h-[42%] w-[55%]"
          aria-hidden
        />
        <div
          className="mm-section-blob mm-section-blob--yellow absolute -right-[12%] bottom-[6%] h-[38%] w-[48%]"
          aria-hidden
        />
        <div
          className="mm-section-blob mm-section-blob--green absolute left-[40%] top-[58%] h-[36%] w-[44%]"
          aria-hidden
        />

        {/* Doodles drift behind the form */}
        <MiMundoFloatingDoodles />

        {/* Slow back-layer butterflies — soft motion, never in front of text */}
        <div className="mm-register-flyers pointer-events-none absolute inset-0 -z-[1]" aria-hidden>
          <MiMundoButterflyTrails layer="back" />
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-10 px-[max(1rem,env(safe-area-inset-left))] pb-16 pt-8 pe-[max(1rem,env(safe-area-inset-right))] md:gap-12 md:pb-20 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-14">
          {/* Figure column — paper card with brush-stroke title + mascot + bullets */}
          <aside className="mm-fade-in-up mm-visible flex w-full justify-self-center lg:max-w-none lg:justify-self-start">
            <section
              aria-labelledby="mm-register-figure-heading"
              className="mm-register-figure relative w-full overflow-hidden rounded-[28px] border-2 border-[var(--mm-green)]/35 bg-[var(--mm-paper)] px-6 py-7 shadow-[0_22px_50px_rgb(0_0_0_/12%)] sm:px-7 sm:py-8"
            >
              <p className="mm-kicker-pill mm-hero-reveal mm-hero-reveal-1 relative inline-block">
                {figureKicker}
              </p>

              <h2
                id="mm-register-figure-heading"
                className="mm-register-figure-title mm-hero-reveal mm-hero-reveal-2 mt-5 text-balance font-[family-name:var(--font-mm-display)] text-[clamp(1.55rem,3.6vw+0.55rem,2.25rem)] leading-[1.25] text-[var(--mm-ink-deep)]"
              >
                {titleWords.map((word, i) => (
                  <span key={`${word}-${i}`} className="mm-title-word">
                    {word}
                    {i < titleWords.length - 1 ? " " : null}
                  </span>
                ))}
              </h2>

              <p className="mm-hero-reveal mm-hero-reveal-3 mt-5 max-w-md text-base leading-relaxed text-[var(--mm-ink)] sm:text-[1.05rem]">
                {figureLead}
              </p>

              {/* Mascot — uses the bob idle animation from the landing */}
              <div className="relative mt-7 flex items-end justify-center">
                <div
                  className="mm-section-blob mm-section-blob--green absolute inset-x-10 -bottom-2 -top-2 -z-[1]"
                  aria-hidden
                />
                <div className="mm-mascot-bob relative h-44 w-44 sm:h-52 sm:w-52">
                  <Image
                    src={mascotSrc}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 176px, 208px"
                    priority
                  />
                </div>
              </div>

              <ul className="mt-7 space-y-3 text-sm font-semibold text-[var(--mm-ink-deep)] sm:text-base">
                <li className="mm-hero-reveal mm-hero-reveal-4 flex items-start gap-3">
                  <span className="mm-register-bullet mm-register-bullet--pink shrink-0">
                    <Heart className="h-4 w-4" aria-hidden strokeWidth={2.2} />
                  </span>
                  <span>{bulletPlay}</span>
                </li>
                <li className="mm-hero-reveal mm-hero-reveal-5 flex items-start gap-3">
                  <span className="mm-register-bullet mm-register-bullet--green shrink-0">
                    <Sprout className="h-4 w-4" aria-hidden strokeWidth={2.2} />
                  </span>
                  <span>{bulletNature}</span>
                </li>
                <li className="mm-hero-reveal mm-hero-reveal-5 flex items-start gap-3">
                  <span className="mm-register-bullet mm-register-bullet--yellow shrink-0">
                    <Sparkles className="h-4 w-4" aria-hidden strokeWidth={2.2} />
                  </span>
                  <span>{bulletCare}</span>
                </li>
              </ul>
            </section>
          </aside>

          {/* Form column — header + paper card with the actual form */}
          <div className="mm-fade-in-up mm-visible w-full min-w-0">
            <header className="mb-7 text-center lg:text-left">
              <h1 className="mm-hero-reveal mm-hero-reveal-1 font-[family-name:var(--font-mm-display)] text-3xl font-bold leading-tight text-[var(--mm-ink-deep)] md:text-4xl">
                {shellTitle}
              </h1>
              <p className="mm-hero-reveal mm-hero-reveal-2 mx-auto mt-3 max-w-xl text-[var(--mm-ink)] md:text-lg lg:mx-0">
                {shellLead}
              </p>
              <span
                className="mm-hero-reveal mm-hero-reveal-3 mt-4 inline-block font-[family-name:var(--font-mm-accent)] text-xl text-[var(--mm-pink)]"
                aria-hidden
              >
                {ctaCallout}
              </span>
            </header>

            <div className="mm-register-form-wrap mm-hero-reveal mm-hero-reveal-4 relative flex justify-center lg:justify-start">
              <RegisterForm
                locale={locale}
                dict={registerDict}
                legalAgeMajority={legalAgeMajority}
                sectionOptions={sectionOptions}
              />
            </div>

            <p className="mm-hero-reveal mm-hero-reveal-5 mt-8 flex justify-center lg:justify-start">
              <Link
                href={`${prefix}/login`}
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--mm-blue-dark)] underline decoration-[var(--mm-blue-dark)]/30 underline-offset-[0.35em] transition hover:decoration-[var(--mm-blue-dark)]"
                aria-label={loginCta}
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
                {loginCta}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MiMundoFontRoot>
  );
}
