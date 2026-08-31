import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { resolveEspacioZenitHeaderLogo } from "@/lib/landing/resolveEspacioZenitHeaderLogo";
import { RegisterForm } from "@/components/register/RegisterForm";
import { EspacioZenitRegisterHeader } from "@/components/molecules/EspacioZenitRegisterHeader";
import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";

export interface RegisterEspacioZenitSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
  extrasPack?: "nago" | null;
  mediaMap?: LandingMediaMap;
  intent?: RegisterIntent;
}

export function RegisterEspacioZenitSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  mediaMap,
  enrollmentLink,
  extrasPack = null,
  intent = "reserve",
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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 md:gap-10 md:pt-14">
        <aside className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] md:items-center">
          <div className="flex flex-col gap-4">
            <p className="ez-mock-brush ez-mock-brush--white text-[clamp(2rem,5vw,3rem)] leading-[0.95]">
              {marketingLandingCopy(dict, "ez", "hero.brushLine1")}
            </p>
            <p className="ez-mock-brush ez-mock-brush--cyan text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
              {marketingLandingCopy(dict, "ez", "hero.brushLine2")}
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
              {marketingLandingCopy(dict, "ez", "hero.tagline")}
            </p>
            <p className="max-w-3xl text-sm leading-relaxed text-white/72">
              {marketingLandingCopy(dict, "ez", "origenes.body")}
            </p>
          </div>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[16rem] overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-[#070b12] shadow-[0_28px_70px_rgb(0_0_0_/50%)]">
            <Image
              src={decoSrc}
              alt=""
              fill
              className="object-cover object-[center_20%]"
              sizes="(max-width:768px) 60vw, 256px"
            />
          </div>
        </aside>

        <div className="w-full min-w-0">
          <div className="mb-6 md:mb-8">
            <h1 className="text-center text-3xl font-bold uppercase leading-tight tracking-[0.12em] text-white md:text-left md:text-4xl">
              {intent === "trial" ? dict.register.trial.shellTitle : ez.register.shellTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-white/75 md:mx-0 md:text-left md:text-base">
              {ez.register.shellLead}
            </p>
          </div>

          <div className="ez-public-sheet w-full rounded-[22px] border border-[rgb(0_174_239_/35%)] p-1">
            <RegisterForm
              locale={locale}
              dict={dict.register}
              legalAgeMajority={legalAgeMajority}
              sectionOptions={sectionOptions}
              enrollmentLink={enrollmentLink}
              extrasPack={extrasPack}
              intent={intent}
            />
          </div>

          <p className="mt-8 flex justify-center md:justify-start">
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
