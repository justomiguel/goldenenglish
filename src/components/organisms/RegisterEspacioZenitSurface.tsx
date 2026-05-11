import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { resolveEspacioZenitHeaderLogo } from "@/lib/landing/resolveEspacioZenitHeaderLogo";
import { RegisterForm } from "@/components/register/RegisterForm";
import { EspacioZenitRegisterHeader } from "@/components/molecules/EspacioZenitRegisterHeader";
import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";

export interface RegisterEspacioZenitSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  mediaMap?: LandingMediaMap;
}

export function RegisterEspacioZenitSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  mediaMap,
}: RegisterEspacioZenitSurfaceProps) {
  const prefix = `/${locale}`;
  const logoSrc = resolveEspacioZenitHeaderLogo(brand, mediaMap);
  const ez = dict.landing.ez;
  const decoSrc = "/images/espaciozenit/landing/2.png";

  return (
    <EspacioZenitFontRoot className="relative min-h-screen overflow-x-hidden bg-black pb-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(48vh,480px)] -z-10 bg-[radial-gradient(ellipse_90%_80%_at_50%_-10%,rgb(0_174_239_/14%)_0%,transparent_62%)]"
        aria-hidden
      />
      <EspacioZenitRegisterHeader
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={brand.logoAlt || brand.name}
        brandDisplayName={brand.name}
        dict={dict}
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-start lg:gap-12">
        <div className="hidden lg:flex lg:flex-col lg:gap-6">
          <p className="ez-mock-brush ez-mock-brush--white text-[clamp(2rem,5vw,3rem)] leading-[0.95]">
            {marketingLandingCopy(dict, "ez", "hero.brushLine1")}
          </p>
          <p className="ez-mock-brush ez-mock-brush--cyan text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
            {marketingLandingCopy(dict, "ez", "hero.brushLine2")}
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
            {marketingLandingCopy(dict, "ez", "hero.tagline")}
          </p>
          <div className="relative mt-4 aspect-[3/4] w-full max-w-md overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-[#070b12] shadow-[0_28px_70px_rgb(0_0_0_/50%)]">
            <Image
              src={decoSrc}
              alt=""
              fill
              className="object-cover object-[center_20%]"
              sizes="(max-width:1024px) 0px, 40vw"
            />
          </div>
          <p className="max-w-md text-sm leading-relaxed text-white/72">
            {marketingLandingCopy(dict, "ez", "origenes.body")}
          </p>
        </div>

        <div className="w-full min-w-0">
          <div className="mb-8 lg:mb-10">
            <h1 className="text-center text-3xl font-bold uppercase leading-tight tracking-[0.12em] text-white md:text-4xl lg:text-left">
              {ez.register.shellTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-white/75 md:text-base lg:mx-0 lg:text-left">
              {ez.register.shellLead}
            </p>
          </div>

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
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--ez-cyan-soft)] underline decoration-[rgb(255_255_255_/25%)] underline-offset-[0.35em] transition hover:decoration-[var(--ez-cyan)] hover:text-[var(--ez-cyan)]"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
    </EspacioZenitFontRoot>
  );
}
