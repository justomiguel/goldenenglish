import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { PublicContactForm } from "@/components/molecules/PublicContactForm";
import { NagoRegisterHeader } from "@/components/molecules/NagoRegisterHeader";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";

export interface PublicContactScreenNagoProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
}

export function PublicContactScreenNago({ locale, dict, brand }: PublicContactScreenNagoProps) {
  const prefix = `/${locale}`;
  const logoSrc = brand.logoPath.trim();
  const pc = dict.publicContact;

  return (
    <NagoFontRoot className="relative min-h-screen pb-16">
      <NagoRegisterHeader locale={locale} logoSrc={logoSrc} logoAlt={brand.logoAlt || brand.name} dict={dict} />
      <div
        className="pointer-events-none absolute inset-x-0 top-[76px] -z-10 h-[min(46vh,420px)] bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,color-mix(in_srgb,var(--nago-gold)_16%,transparent)_0%,transparent_58%)]"
        aria-hidden
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12">
        <aside className="hidden lg:block lg:pt-2">
          <div className="rounded-2xl border border-[var(--nago-gold)]/30 bg-[var(--nago-bg-2)] p-8">
            <h2 className="font-[family-name:var(--font-nago-display)] text-3xl font-semibold uppercase leading-tight tracking-wide text-[var(--nago-heading-solid)] md:text-4xl">
              {marketingLandingCopy(dict, "nago", "hero.title")}
            </h2>
            <p className="mt-4 text-lg font-semibold text-[var(--nago-gold)]">
              {marketingLandingCopy(dict, "nago", "hero.subtitle")}
            </p>
          </div>
        </aside>
        <div className="w-full min-w-0">
          <header className="mb-8 text-center lg:mb-10 lg:text-left">
            <h1 className="font-[family-name:var(--font-nago-display)] text-3xl font-semibold uppercase tracking-wide text-[var(--nago-heading-solid)] md:text-4xl">
              {pc.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[var(--nago-ink-muted)] md:text-lg lg:mx-0">
              {pc.lead}
            </p>
          </header>
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-lg rounded-2xl border border-[var(--nago-gold)]/30 bg-[var(--color-surface)] p-6 md:p-8">
              <PublicContactForm locale={locale} labels={pc} />
            </div>
          </div>
          <p className="mt-8 flex justify-center lg:justify-start">
            <Link
              href={`${prefix}/login`}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--nago-gold)] underline underline-offset-4"
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
