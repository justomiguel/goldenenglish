import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import type { Dictionary } from "@/types/i18n";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { PublicAnswerArticle } from "@/components/organisms/PublicAnswerArticle";
import type { BrandPublic } from "@/lib/brand/server";
import { renderOwnedSurface } from "@/variants/ownedSurfaces";

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

  const sheet = renderOwnedSurface("publicSheet", templateKind, {
    locale,
    dict,
    brand,
    sessionEmail,
    logoAlt,
    title,
    lead,
    items,
    children: (
      <>
        {main("mx-auto max-w-3xl")}
        {footer("light")}
      </>
    ),
  });
  if (sheet) return sheet;
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)]">
      <RegisterSiteHeader brand={brand} locale={locale} dict={dict} sessionEmail={sessionEmail} />
      {main()}
      {footer("light")}
    </div>
  );
}
