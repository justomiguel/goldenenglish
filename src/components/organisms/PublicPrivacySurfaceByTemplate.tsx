import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { NagoRegisterHeader } from "@/components/molecules/NagoRegisterHeader";
import { LioraRegisterHeader } from "@/components/molecules/LioraRegisterHeader";
import { MiMundoRegisterHeader } from "@/components/molecules/MiMundoRegisterHeader";
import { MozarthitosRegisterHeader } from "@/components/molecules/MozarthitosRegisterHeader";
import { EspacioZenitRegisterHeader } from "@/components/molecules/EspacioZenitRegisterHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { PublicPrivacyArticle } from "@/components/organisms/PublicPrivacyArticle";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";
import { MiMundoFontRoot } from "@/components/organisms/MiMundoFontRoot";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";
import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";

interface PublicPrivacySurfaceByTemplateProps {
  templateKind: string;
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
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
}: PublicPrivacySurfaceByTemplateProps) {
  const logoSrc = brand.logoPath.trim();
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

  if (templateKind === "nago") {
    return (
      <NagoFontRoot className="relative min-h-screen pb-16">
        <NagoRegisterHeader locale={locale} logoSrc={resolveNagoLogo(brand)} logoAlt={logoAlt} dict={dict} />
        <PrivacyMain
          locale={locale}
          dict={dict}
          brand={brand}
          sheetClass="nago-public-sheet mx-auto max-w-3xl rounded-2xl border border-[var(--nago-gold)]/20 bg-[var(--nago-bg-2)] p-6 md:p-8"
          wash={
            <div
              className="pointer-events-none absolute inset-x-0 top-[76px] -z-10 h-[min(46vh,420px)] bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,color-mix(in_srgb,var(--nago-gold)_16%,transparent)_0%,transparent_58%)]"
              aria-hidden
            />
          }
        />
        {footer("dark", "compactDark")}
      </NagoFontRoot>
    );
  }
  if (templateKind === "liora") {
    return (
      <LioraFontRoot className="relative min-h-screen pb-16">
        <LioraRegisterHeader locale={locale} logoSrc={logoSrc} logoAlt={logoAlt} dict={dict} />
        <PrivacyMain
          locale={locale}
          dict={dict}
          brand={brand}
          sheetClass="liora-public-sheet mx-auto max-w-3xl"
        />
        {footer("light")}
      </LioraFontRoot>
    );
  }
  if (templateKind === "mimundo") {
    return (
      <MiMundoFontRoot className="relative min-h-screen pb-16">
        <MiMundoRegisterHeader locale={locale} logoSrc={logoSrc} logoAlt={logoAlt} dict={dict} />
        <PrivacyMain
          locale={locale}
          dict={dict}
          brand={brand}
          sheetClass="mimundo-public-sheet mx-auto max-w-3xl"
        />
        {footer("light")}
      </MiMundoFontRoot>
    );
  }
  if (templateKind === "mozarthitos") {
    return (
      <MozarthitosFontRoot className="relative min-h-screen pb-16">
        <MozarthitosRegisterHeader locale={locale} logoSrc={logoSrc} logoAlt={logoAlt} dict={dict} />
        <PrivacyMain
          locale={locale}
          dict={dict}
          brand={brand}
          sheetClass="mz-public-sheet mx-auto max-w-3xl"
        />
        {footer("light")}
      </MozarthitosFontRoot>
    );
  }
  if (templateKind === "espaciozenit") {
    return (
      <EspacioZenitFontRoot className="relative min-h-screen overflow-x-hidden bg-black pb-16 text-white">
        <EspacioZenitRegisterHeader
          locale={locale}
          logoSrc={logoSrc}
          logoAlt={logoAlt}
          brandDisplayName={brand.name}
          dict={dict}
        />
        <PrivacyMain
          locale={locale}
          dict={dict}
          brand={brand}
          sheetClass="ez-public-sheet mx-auto max-w-3xl rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-[#070b12]/80 p-6 md:p-8"
          wash={
            <div
              className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(48vh,480px)] bg-[radial-gradient(ellipse_90%_80%_at_50%_-10%,rgb(0_174_239_/14%)_0%,transparent_62%)]"
              aria-hidden
            />
          }
        />
        {footer("dark", "compactDark")}
      </EspacioZenitFontRoot>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)]">
      <RegisterSiteHeader brand={brand} locale={locale} dict={dict} />
      <PrivacyMain locale={locale} dict={dict} brand={brand} />
      {footer("light")}
    </div>
  );
}
