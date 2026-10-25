import type { ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import { loadRequestSessionEmail } from "@/lib/auth/loadRequestSessionEmail";
import { resolvePublicBrand } from "@/lib/brand/resolvePublicBrand";
import { type AppLocale } from "@/lib/i18n/dictionaries";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { PublicExperienceChrome } from "@/components/pwa/molecules/PublicExperienceFrame";

export interface PublicExperienceShellProps {
  locale: string;
  dict: Dictionary;
  templateKind: string;
  sessionEmail?: string | null;
  coursesLabel?: string;
  children: ReactNode;
}

export async function PublicExperienceShell({
  locale,
  dict,
  templateKind,
  sessionEmail,
  coursesLabel,
  children,
}: PublicExperienceShellProps) {
  const [inscriptionsEnabled, merchEnabled, blogEnabled, resolvedEmail, brand] = await Promise.all([
    getInscriptionsEnabled(),
    loadMerchEnabled(),
    loadBlogEnabled(),
    sessionEmail !== undefined ? Promise.resolve(sessionEmail) : loadRequestSessionEmail(),
    resolvePublicBrand(locale as AppLocale),
  ]);
  const logoSrc = templateKind === "nago" ? resolveNagoLogo(brand) : brand.logoPath;

  return (
    <PublicExperienceChrome
      dict={dict}
      locale={locale}
      sessionEmail={resolvedEmail}
      templateKind={templateKind}
      logoSrc={logoSrc}
      logoAlt={brand.logoAlt || brand.name}
      inscriptionsEnabled={inscriptionsEnabled}
      merchEnabled={merchEnabled}
      blogEnabled={blogEnabled}
      coursesLabel={coursesLabel}
    >
      {children}
    </PublicExperienceChrome>
  );
}
