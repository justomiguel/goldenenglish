import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { RegisterForm } from "@/components/register/RegisterForm";
import { NagoRegisterHeader } from "@/components/molecules/NagoRegisterHeader";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";

export interface RegisterNagoSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
}

export function RegisterNagoSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
}: RegisterNagoSurfaceProps) {
  const prefix = `/${locale}`;
  const nago = dict.landing.nago;
  const logoSrc = brand.logoPath.trim();

  return (
    <NagoFontRoot className="relative min-h-screen pb-16">
      <NagoRegisterHeader
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={brand.logoAlt || brand.name}
        dict={dict}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-[76px] -z-10 h-[min(46vh,420px)] bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,color-mix(in_srgb,var(--nago-green)_14%,transparent)_0%,transparent_58%)]"
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12">
        <aside className="hidden lg:block lg:pt-2">
          <div className="rounded-2xl border border-[var(--nago-green)]/25 bg-white p-8 shadow-[0_20px_50px_rgb(0_0_0_/8%)]">
            <h2 className="text-3xl font-bold uppercase leading-tight tracking-wide text-[var(--nago-ink)] md:text-4xl">
              {marketingLandingCopy(dict, "nago", "hero.title")}
            </h2>
            <p className="mt-4 text-lg font-semibold text-[var(--nago-green)]">
              {marketingLandingCopy(dict, "nago", "hero.subtitle")}
            </p>
            <p className="mt-6 text-sm leading-relaxed text-[var(--nago-ink)]/88">
              {marketingLandingCopy(dict, "nago", "hero.tagline")}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-[var(--nago-ink)]/78">
              {marketingLandingCopy(dict, "nago", "sobreNosotros.bodyP1")}
            </p>
          </div>
        </aside>

        <div className="w-full min-w-0">
          <header className="mb-8 text-center lg:mb-10 lg:text-left">
            <h1 className="text-3xl font-bold uppercase tracking-wide text-[var(--nago-ink)] md:text-4xl">
              {nago.register.shellTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[var(--nago-ink)]/80 md:text-lg lg:mx-0">
              {nago.register.shellLead}
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
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--nago-green)] underline decoration-[var(--nago-green)]/35 underline-offset-[0.35em] transition hover:decoration-[var(--nago-green)]"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
    </NagoFontRoot>
  );
}
