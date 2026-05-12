import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";
import { MozarthitosRegisterHeader } from "@/components/molecules/MozarthitosRegisterHeader";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";

export interface PublicContactScreenMozarthitosProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  mediaMap?: LandingMediaMap;
}

export function PublicContactScreenMozarthitos({
  locale,
  dict,
  brand,
  mediaMap,
}: PublicContactScreenMozarthitosProps) {
  const prefix = `/${locale}`;
  const logoSrc = resolveLandingImageSrcForTheme("mozarthitos", "inicio", "1.png", mediaMap);
  const heroFigureSrc = resolveLandingImageSrcForTheme("mozarthitos", "inicio", "2.png", mediaMap);
  const pc = dict.publicContact;

  return (
    <MozarthitosFontRoot className="relative min-h-screen pb-16">
      <MozarthitosRegisterHeader locale={locale} logoSrc={logoSrc} logoAlt={brand.logoAlt || brand.name} dict={dict} />
      <div
        className="pointer-events-none absolute inset-x-0 top-[72px] -z-10 h-[min(50vh,460px)] bg-[radial-gradient(ellipse_85%_75%_at_50%_-5%,color-mix(in_srgb,var(--mz-yellow)_22%,transparent)_0%,transparent_60%)] opacity-90 md:top-20"
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 md:pt-12 lg:grid-cols-[minmax(0,360px)_minmax(0,1.12fr)] lg:items-start lg:gap-12 xl:gap-14">
        <aside className="hidden lg:block lg:pt-4">
          <div className="relative aspect-square w-full max-w-[340px] overflow-hidden rounded-[26px] border-2 border-[color-mix(in_srgb,var(--mz-yellow)_58%,transparent)] shadow-[0_22px_50px_rgb(0_0_0_/12%)]">
            <Image
              src={heroFigureSrc}
              alt=""
              fill
              className="object-cover object-[10%_50%] [transform-origin:14%_50%] scale-[1.2]"
              sizes="(max-width: 1024px) 0px, 340px"
            />
          </div>
        </aside>
        <div className="w-full min-w-0">
          <header className="mb-8 text-center lg:mb-10 lg:text-left">
            <h1 className="text-3xl font-bold text-[var(--mz-ink-on-white)] md:text-4xl">
              {pc.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[var(--mz-ink-on-white)]/85 md:text-lg lg:mx-0">
              {pc.lead}
            </p>
          </header>
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-lg rounded-[26px] border-2 border-[color-mix(in_srgb,var(--mz-yellow)_45%,transparent)] bg-[color-mix(in_srgb,var(--mz-white)_96%,white)] p-6 shadow-[0_22px_50px_rgb(0_0_0_/8%)] md:p-8">
              <PublicContactForm locale={locale} labels={pc} />
            </div>
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
