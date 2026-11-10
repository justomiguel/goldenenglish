import Link from "next/link";
import { LogIn } from "lucide-react";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { RegisterForm } from "@/components/register/RegisterForm";
import { MatissFontRoot } from "@/components/organisms/MatissFontRoot";
import { MatissSiteHeader } from "@/components/organisms/MatissSiteHeader";
import type { RegisterSectionMode } from "@/lib/settings/registerSectionMode";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";

export interface RegisterMatissSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
  extrasPack?: RegistrationExtrasPackId | null;
  intent?: RegisterIntent;
  sessionEmail?: string | null;
  sectionMode?: RegisterSectionMode;
}

export function RegisterMatissSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
  extrasPack = null,
  intent = "reserve",
  sessionEmail = null,
  sectionMode = "first_open",
}: RegisterMatissSurfaceProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);

  return (
    <MatissFontRoot className="relative min-h-screen pb-16">
      <MatissSiteHeader
        locale={locale}
        logoSrc={brand.logoPath}
        logoAlt={brand.logoAlt}
        dict={dict}
        sessionEmail={sessionEmail}
        links={[{ href: `/${locale}`, label: t("nav.inicio") }]}
        openMenu={t("chrome.openMenu")}
        closeMenu={t("chrome.closeMenu")}
      />
      <div className="mx-auto w-full max-w-3xl px-4 pt-10">
        <h1 className="matiss-display text-4xl text-[var(--matiss-ink)]">
          {intent === "trial" ? dict.register.trial.shellTitle : t("register.shellTitle")}
        </h1>
        <p className="mt-4 text-[var(--matiss-ink-soft)]">{t("register.shellLead")}</p>
        <div className="mt-8 rounded-3xl bg-white p-2">
          <RegisterForm
            locale={locale}
            dict={dict.register}
            legalAgeMajority={legalAgeMajority}
            sectionOptions={sectionOptions}
            enrollmentLink={enrollmentLink}
            extrasPack={extrasPack}
            intent={intent}
            sectionMode={sectionMode}
          />
        </div>
        <p className="mt-8">
          <Link href={`/${locale}/login`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--matiss-violet-deep)] underline">
            <LogIn className="h-4 w-4" aria-hidden />
            {dict.login.title}
          </Link>
        </p>
      </div>
    </MatissFontRoot>
  );
}
