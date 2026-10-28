import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import type { Dictionary } from "@/types/i18n";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { NagoRegisterHeader } from "@/components/molecules/NagoRegisterHeader";
import { LioraRegisterHeader } from "@/components/molecules/LioraRegisterHeader";
import { MiMundoRegisterHeader } from "@/components/molecules/MiMundoRegisterHeader";
import { MozarthitosRegisterHeader } from "@/components/molecules/MozarthitosRegisterHeader";
import { EspacioZenitRegisterHeader } from "@/components/molecules/EspacioZenitRegisterHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { PublicAnswerArticle } from "@/components/organisms/PublicAnswerArticle";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";
import { MiMundoFontRoot } from "@/components/organisms/MiMundoFontRoot";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";
import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";
import type { BrandPublic } from "@/lib/brand/server";

interface PublicAnswerSurfaceByTemplateProps {
  templateKind: string;
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail?: string | null;
  title: string;
  lead: string;
  items: readonly InstituteAnswerItem[];
}

function AnswerMain({
  sheetClass,
  wash,
  title,
  lead,
  items,
}: {
  sheetClass?: string;
  wash?: ReactNode;
  title: string;
  lead: string;
  items: readonly InstituteAnswerItem[];
}) {
  const article = <PublicAnswerArticle title={title} lead={lead} items={items} />;
  return (
    <main aria-labelledby="public-answers-title">
      {wash}
      <div className="px-4 py-10 md:py-14">
        {sheetClass ? <div className={sheetClass}>{article}</div> : article}
      </div>
    </main>
  );
}

export function PublicAnswerSurfaceByTemplate({
  templateKind,
  locale,
  dict,
  brand,
  sessionEmail = null,
  title,
  lead,
  items,
}: PublicAnswerSurfaceByTemplateProps) {
  const logoSrc = brand.logoPath.trim();
  const logoAlt = brand.logoAlt || brand.name;
  const main = (sheetClass?: string, wash?: ReactNode) => (
    <AnswerMain sheetClass={sheetClass} wash={wash} title={title} lead={lead} items={items} />
  );
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
        <NagoRegisterHeader locale={locale} logoSrc={resolveNagoLogo(brand)} logoAlt={logoAlt} dict={dict} sessionEmail={sessionEmail} />
        {main(
          "nago-public-sheet mx-auto max-w-3xl rounded-2xl border border-[var(--nago-gold)]/20 bg-[var(--nago-bg-2)] p-6 md:p-8",
          <div
            className="pointer-events-none absolute inset-x-0 top-[76px] -z-10 h-[min(46vh,420px)] bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,color-mix(in_srgb,var(--nago-gold)_16%,transparent)_0%,transparent_58%)]"
            aria-hidden
          />,
        )}
        {footer("dark", "compactDark")}
      </NagoFontRoot>
    );
  }
  if (templateKind === "liora") {
    return (
      <LioraFontRoot className="relative min-h-screen pb-16">
        <LioraRegisterHeader locale={locale} logoSrc={logoSrc} logoAlt={logoAlt} dict={dict} sessionEmail={sessionEmail} />
        {main("liora-public-sheet mx-auto max-w-3xl")}
        {footer("light")}
      </LioraFontRoot>
    );
  }
  if (templateKind === "mimundo") {
    return (
      <MiMundoFontRoot className="relative min-h-screen pb-16">
        <MiMundoRegisterHeader locale={locale} logoSrc={logoSrc} logoAlt={logoAlt} dict={dict} sessionEmail={sessionEmail} />
        {main("mimundo-public-sheet mx-auto max-w-3xl")}
        {footer("light")}
      </MiMundoFontRoot>
    );
  }
  if (templateKind === "mozarthitos") {
    return (
      <MozarthitosFontRoot className="relative min-h-screen pb-16">
        <MozarthitosRegisterHeader locale={locale} logoSrc={logoSrc} logoAlt={logoAlt} dict={dict} sessionEmail={sessionEmail} />
        {main("mz-public-sheet mx-auto max-w-3xl")}
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
          sessionEmail={sessionEmail}
        />
        {main(
          "ez-public-sheet mx-auto max-w-3xl rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-[#070b12]/80 p-6 md:p-8",
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(48vh,480px)] bg-[radial-gradient(ellipse_90%_80%_at_50%_-10%,rgb(0_174_239_/14%)_0%,transparent_62%)]"
            aria-hidden
          />,
        )}
        {footer("dark", "compactDark")}
      </EspacioZenitFontRoot>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)]">
      <RegisterSiteHeader brand={brand} locale={locale} dict={dict} sessionEmail={sessionEmail} />
      {main()}
      {footer("light")}
    </div>
  );
}
