import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { RegisterForm } from "@/components/register/RegisterForm";
import { RegisterClassicFigure } from "@/components/molecules/RegisterClassicFigure";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { PublicPrivacyFooterLink } from "@/components/molecules/PublicPrivacyFooterLink";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";

export interface RegisterClassicSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
  extrasPack?: "nago" | null;
  intent?: RegisterIntent;
  sessionEmail?: string | null;
  showAllSections?: boolean;
}

export function RegisterClassicSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
  extrasPack = null,
  intent = "reserve",
  sessionEmail = null,
  showAllSections = false,
}: RegisterClassicSurfaceProps) {
  const copy = dict.landing.classic.register;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(55vh,520px)] -z-10 bg-[radial-gradient(ellipse_90%_80%_at_50%_-10%,color-mix(in_srgb,var(--color-accent)_16%,transparent)_0%,transparent_65%)] opacity-90"
        aria-hidden
      />
      <RegisterSiteHeader brand={brand} locale={locale} dict={dict} sessionEmail={sessionEmail} />

      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-start">
        <RegisterClassicFigure
          title={copy.figureTitle}
          lead={copy.figureLead}
          collageAlts={dict.landing.collage.alts}
        />

        <div className="w-full min-w-0">
          <header className="mb-6 text-center md:mb-8 lg:text-left">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-primary)] md:text-4xl">
              {intent === "trial" ? dict.register.trial.shellTitle : copy.shellTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted-foreground)] lg:mx-0 md:text-lg">
              {copy.shellLead}
            </p>
          </header>
          <div className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_18px_40px_-28px_color-mix(in_srgb,var(--color-foreground)_28%,transparent)] md:p-8">
            <RegisterForm
              locale={locale}
              dict={dict.register}
              legalAgeMajority={legalAgeMajority}
              sectionOptions={sectionOptions}
              enrollmentLink={enrollmentLink}
              extrasPack={extrasPack}
              intent={intent}
              showAllSections={showAllSections}
            />
          </div>
          <p className="mt-8 flex justify-center lg:justify-start">
            <Link
              href={`/${locale}/login`}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--color-primary)] underline decoration-[var(--color-primary)]/35 underline-offset-2 transition hover:decoration-[var(--color-primary)]"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
      <PublicContentLanguageFooter
        locale={locale}
        labels={dict.common.locale}
        extra={
          <PublicPrivacyFooterLink
            locale={locale}
            label={dict.privacy.footerLink}
            className="text-sm text-[var(--color-muted-foreground)] underline decoration-current/30 underline-offset-2 hover:text-[var(--color-foreground)]"
          />
        }
      />
    </div>
  );
}
