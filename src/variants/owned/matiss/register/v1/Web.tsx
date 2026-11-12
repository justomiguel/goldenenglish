import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import type { BrandPublic } from "@/lib/brand/server";
import { resolveLandingImageSrcForTheme, type LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { RegisterForm } from "@/components/register/RegisterForm";
import { MatissFontRoot } from "@/variants/owned/matiss/font/v1/Web";
import { MatissSiteHeader } from "@/variants/owned/matiss/header/v1/Web";
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
  mediaMap?: LandingMediaMap;
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
  mediaMap,
  sessionEmail = null,
  sectionMode = "first_open",
}: RegisterMatissSurfaceProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  const photoSrc = resolveLandingImageSrcForTheme("matiss", "inicio", "2.jpg", mediaMap);

  return (
    <MatissFontRoot className="relative min-h-screen pb-16">
      <MatissSiteHeader
        locale={locale}
        brandName={brand.name}
        logoAlt={brand.logoAlt}
        dict={dict}
        sessionEmail={sessionEmail}
        links={[{ href: `/${locale}`, label: t("nav.inicio") }]}
        openMenu={t("chrome.openMenu")}
        closeMenu={t("chrome.closeMenu")}
      />
      <div className="mx-auto grid w-full max-w-5xl items-start gap-8 px-4 pt-10 md:grid-cols-[16rem_1fr]">
        <Image
          src={photoSrc}
          alt={t("hero.photoAlt")}
          width={864}
          height={1152}
          priority
          className="mx-auto aspect-[3/4] w-full max-w-xs rounded-[36px] object-cover object-top"
        />
        <div>
          <h1 className="matiss-display text-4xl text-[var(--ds-color-foreground)]">
          {intent === "trial" ? dict.register.trial.shellTitle : t("register.shellTitle")}
        </h1>
          <p className="mt-4 text-[var(--ds-color-muted-foreground)]">{t("register.shellLead")}</p>
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
            <Link href={`/${locale}/login`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--ds-color-primary)] underline">
              <LogIn className="h-4 w-4" aria-hidden />
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
    </MatissFontRoot>
  );
}

export default RegisterMatissSurface;
