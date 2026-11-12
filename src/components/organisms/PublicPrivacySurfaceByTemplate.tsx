import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { PublicPrivacyArticle } from "@/components/organisms/PublicPrivacyArticle";
import { renderOwnedSurface } from "@/variants/ownedSurfaces";

interface PublicPrivacySurfaceByTemplateProps {
  templateKind: string;
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
}

function PrivacyMain({
  sheetClass,
  wash,
  locale,
  dict,
  brand,
}: {
  sheetClass?: string;
  wash?: ReactNode;
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
}) {
  const article = <PublicPrivacyArticle locale={locale} dict={dict} contact={brand} />;
  return (
    <main aria-labelledby="privacy-page-title">
      {wash}
      <div className="px-4 py-10 md:py-14">
        {sheetClass ? <div className={sheetClass}>{article}</div> : article}
      </div>
    </main>
  );
}

export function PublicPrivacySurfaceByTemplate({
  templateKind,
  locale,
  dict,
  brand,
  sessionEmail = null,
}: PublicPrivacySurfaceByTemplateProps) {
  const logoAlt = brand.logoAlt || brand.name;
  const footer = (
    tone: "light" | "dark",
    variant?: "default" | "compact" | "compactDark",
  ) => (
    <PublicContentLanguageFooter
      locale={locale}
      labels={dict.common.locale}
      tone={tone}
      variant={variant}
    />
  );

  const sheet = renderOwnedSurface("publicSheet", templateKind, {
    locale,
    dict,
    brand,
    sessionEmail,
    logoAlt,
    children: (
      <>
        <PrivacyMain locale={locale} dict={dict} brand={brand} sheetClass="mx-auto max-w-3xl" />
        {footer("light")}
      </>
    ),
  });
  if (sheet) return sheet;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)]">
      <RegisterSiteHeader brand={brand} locale={locale} dict={dict} sessionEmail={sessionEmail} />
      <PrivacyMain locale={locale} dict={dict} brand={brand} />
      {footer("light")}
    </div>
  );
}
