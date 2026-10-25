import type { ReactNode } from "react";
import { PublicFlowHeader } from "@/components/molecules/PublicFlowHeader";
import { PublicExperienceShell } from "@/components/organisms/PublicExperienceShell";
import { PublicTenantChrome } from "@/components/organisms/PublicTenantChrome";
import { loadRequestSessionEmail } from "@/lib/auth/loadRequestSessionEmail";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { type AppLocale } from "@/lib/i18n/dictionaries";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { publicExperienceVariant } from "@/lib/theme/publicExperienceNav";

interface PublicFlowFrameProps {
  locale: string;
  children: ReactNode;
}

/** Payments, surveys, and share pages. Full width. No blog sheet. */
export async function PublicFlowFrame({ locale, children }: PublicFlowFrameProps) {
  const loc = locale as AppLocale;
  const [{ brand, needsInitialSiteSetup, dict: baseDict }, snapshot, sessionEmail] =
    await Promise.all([
      resolvePublicBrandWithSetup(loc),
      loadActiveTheme(),
      loadRequestSessionEmail(),
    ]);

  if (needsInitialSiteSetup) return children;

  const templateKind = snapshot?.theme.templateKind ?? "classic";
  const dict = applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);
  const logoSrc = templateKind === "nago" ? resolveNagoLogo(brand) : brand.logoPath;
  const tone = publicExperienceVariant(templateKind);

  return (
    <PublicExperienceShell
      locale={locale}
      dict={dict}
      templateKind={templateKind}
      sessionEmail={sessionEmail}
    >
      <PublicTenantChrome templateKind={templateKind} className="min-h-svh">
        <PublicFlowHeader
          locale={locale}
          logoSrc={logoSrc}
          logoAlt={brand.logoAlt || brand.name}
          dict={dict}
          sessionEmail={sessionEmail}
          tone={tone}
        />
        {children}
      </PublicTenantChrome>
    </PublicExperienceShell>
  );
}
