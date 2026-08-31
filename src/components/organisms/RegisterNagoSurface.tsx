import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { RegisterForm } from "@/components/register/RegisterForm";
import { NagoRegisterHeader } from "@/components/molecules/NagoRegisterHeader";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";

export interface RegisterNagoSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
  extrasPack?: "nago" | null;
  intent?: RegisterIntent;
}

export function RegisterNagoSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
  extrasPack = null,
  intent = "reserve",
}: RegisterNagoSurfaceProps) {
  const prefix = `/${locale}`;
  const nago = dict.landing.nago;
  const logoSrc = resolveNagoLogo(brand);

  return (
    <NagoFontRoot className="relative min-h-screen pb-16">
      <NagoRegisterHeader
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={brand.logoAlt || brand.name}
        dict={dict}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-[76px] -z-10 h-[min(46vh,420px)] bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,color-mix(in_srgb,var(--nago-gold)_16%,transparent)_0%,transparent_58%)]"
        aria-hidden
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-8 md:gap-10 md:pt-12">
        <aside>
          <div className="rounded-2xl border border-[var(--nago-gold)]/30 bg-[var(--nago-bg-2)] p-6 md:p-8">
            <h2 className="font-[family-name:var(--font-nago-display)] text-3xl font-semibold uppercase leading-tight tracking-wide text-[var(--nago-heading-solid)] md:text-4xl">
              {marketingLandingCopy(dict, "nago", "hero.title")}{" "}
              <span className="text-[var(--nago-gold)]">
                {marketingLandingCopy(dict, "nago", "hero.titleAccent")}
              </span>
            </h2>
            <p className="mt-3 text-lg font-semibold text-[var(--nago-gold)]">
              {marketingLandingCopy(dict, "nago", "hero.subtitle")}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--nago-ink-muted)]">
              {marketingLandingCopy(dict, "nago", "hero.tagline")}{" "}
              {marketingLandingCopy(dict, "nago", "sobreNosotros.bodyP1")}
            </p>
          </div>
        </aside>

        <div className="w-full min-w-0">
          <header className="mb-6 text-center md:mb-8 md:text-left">
            <h1 className="font-[family-name:var(--font-nago-display)] text-3xl font-semibold uppercase tracking-wide text-[var(--nago-heading-solid)] md:text-4xl">
              {intent === "trial" ? dict.register.trial.shellTitle : nago.register.shellTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--nago-ink-muted)] md:mx-0 md:text-lg">
              {nago.register.shellLead}
            </p>
          </header>
          <div className="nago-public-sheet w-full rounded-2xl border border-[var(--nago-gold)]/30 p-6 md:p-8">
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
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--nago-gold)] underline decoration-[var(--nago-gold)]/35 underline-offset-[0.35em] transition hover:decoration-[var(--nago-gold)]"
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
