import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { resolveEspacioZenitHeaderLogo } from "@/lib/landing/resolveEspacioZenitHeaderLogo";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";
import { EspacioZenitRegisterHeader } from "@/components/molecules/EspacioZenitRegisterHeader";
import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";

export interface PublicContactScreenEspacioZenitProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  mediaMap?: LandingMediaMap;
}

export function PublicContactScreenEspacioZenit({
  locale,
  dict,
  brand,
  mediaMap,
}: PublicContactScreenEspacioZenitProps) {
  const prefix = `/${locale}`;
  const logoSrc = resolveEspacioZenitHeaderLogo(brand, mediaMap);
  const decoSrc = "/images/espaciozenit/landing/2.png";
  const pc = dict.publicContact;

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
          <div className="relative mt-2 aspect-[3/4] w-full max-w-md overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-[#070b12] shadow-[0_28px_70px_rgb(0_0_0_/50%)]">
            <Image
              src={decoSrc}
              alt=""
              fill
              className="object-cover object-[center_20%]"
              sizes="(max-width:1024px) 0px, 40vw"
            />
          </div>
        </div>

        <div className="w-full min-w-0">
          <header className="mb-8 text-center lg:mb-10 lg:text-left">
            <h1 className="text-center text-3xl font-bold uppercase leading-tight tracking-[0.12em] text-white md:text-4xl lg:text-left">
              {pc.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-white/75 md:text-base lg:mx-0 lg:text-left">
              {pc.lead}
            </p>
          </header>
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-lg rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-[#070b12]/80 p-6 shadow-[0_28px_70px_rgb(0_0_0_/40%)] backdrop-blur-sm md:p-8">
              <PublicContactForm locale={locale} labels={pc} />
            </div>
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
