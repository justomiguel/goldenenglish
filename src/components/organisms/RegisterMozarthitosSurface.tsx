import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { RegisterForm } from "@/components/register/RegisterForm";
import { MozarthitosReveal } from "@/components/molecules/MozarthitosReveal";
import { MozarthitosRegisterHeader } from "@/components/molecules/MozarthitosRegisterHeader";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";

export interface RegisterMozarthitosSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  mediaMap?: LandingMediaMap;
}

export function RegisterMozarthitosSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  mediaMap,
}: RegisterMozarthitosSurfaceProps) {
  const prefix = `/${locale}`;
  const logoSrc = resolveLandingImageSrcForTheme(
    "mozarthitos",
    "inicio",
    "1.png",
    mediaMap,
  );
  const heroFigureSrc = resolveLandingImageSrcForTheme(
    "mozarthitos",
    "inicio",
    "2.png",
    mediaMap,
  );
  const mz = dict.landing.mz;

  return (
    <MozarthitosFontRoot className="relative min-h-screen pb-16">
      <MozarthitosRegisterHeader
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={brand.logoAlt || brand.name}
        dict={dict}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-[72px] -z-10 h-[min(50vh,460px)] bg-[radial-gradient(ellipse_85%_75%_at_50%_-5%,color-mix(in_srgb,var(--mz-yellow)_22%,transparent)_0%,transparent_60%)] opacity-90 md:top-20"
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 md:pt-12 lg:grid-cols-[minmax(0,360px)_minmax(0,1.12fr)] lg:items-start lg:gap-12 xl:gap-14">
        <aside className="flex w-full max-w-[min(100%,380px)] flex-col items-center justify-self-center lg:max-w-none lg:justify-self-start lg:pt-4">
          <section
            aria-labelledby="mz-register-figure-heading"
            className="relative w-full overflow-hidden rounded-[26px] border-2 border-[color-mix(in_srgb,var(--mz-yellow)_58%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--mz-yellow-soft)_95%,white)] via-[color-mix(in_srgb,var(--mz-white)_94%,var(--mz-yellow-soft))] to-[var(--mz-white)] p-5 shadow-[0_22px_50px_rgb(0_0_0_/12%)] sm:rounded-[28px] sm:p-6"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-14 -top-10 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--mz-pink)_18%,transparent)] blur-3xl md:h-52 md:w-52"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[color-mix(in_srgb,var(--mz-yellow)_35%,transparent)] blur-3xl"
            />
            <p className="relative text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[var(--mz-pink-deep)]">
              {mz.register.figureKicker}
            </p>
            <h2
              id="mz-register-figure-heading"
              className="relative mt-3 text-balance font-[family-name:var(--font-mz-display)] text-[clamp(1.35rem,3.8vw+0.55rem,1.95rem)] font-bold leading-[1.08] text-[var(--mz-ink-on-white)]"
            >
              {mz.register.figureTitle}
            </h2>
            <p className="relative mt-3 text-sm font-medium leading-snug text-[var(--mz-ink-on-white)]/88 sm:text-base">
              {mz.register.figureLead}
            </p>
            <div className="relative mt-7 sm:mt-8">
              <MozarthitosReveal preset="heroImage" eager className="w-full">
                <div className="mz-register-hero-figure w-full max-w-full">
                  <div className="relative aspect-square w-full overflow-hidden rounded-[inherit]">
                    <Image
                      src={heroFigureSrc}
                      alt=""
                      fill
                      className="object-cover object-[10%_50%] [transform-origin:14%_50%] scale-[1.24] sm:scale-[1.2] lg:scale-[1.18]"
                      sizes="(max-width: 1024px) min(340px, 92vw), 312px"
                      priority
                    />
                  </div>
                </div>
              </MozarthitosReveal>
            </div>
          </section>
        </aside>

        <div className="w-full min-w-0">
          <header className="mb-8 text-center lg:mb-10 lg:text-left">
            <h1 className="text-3xl font-bold text-[var(--mz-ink-on-white)] md:text-4xl">
              {mz.register.shellTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[var(--mz-ink-on-white)]/85 md:text-lg lg:mx-0">
              {mz.register.shellLead}
            </p>
          </header>
          <div className="flex justify-center lg:justify-start">
            <RegisterForm
              locale={locale}
              dict={dict.register}
              legalAgeMajority={legalAgeMajority}
              sectionOptions={sectionOptions}
            />
          </div>
          <p className="mt-8 flex justify-center lg:justify-start">
            <Link
              href={`${prefix}/login`}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--mz-blue-btn)] underline decoration-[var(--mz-blue-btn)]/30 underline-offset-[0.35em] transition hover:decoration-[var(--mz-blue-btn)]"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
    </MozarthitosFontRoot>
  );
}
