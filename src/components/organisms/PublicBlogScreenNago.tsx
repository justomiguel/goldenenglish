import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { NagoSiteHeader } from "@/components/organisms/NagoSiteHeader";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";
import { nagoSiteHeaderLabels } from "@/lib/landing/nagoSiteHeaderLabels";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";

export interface PublicBlogScreenNagoProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail: string | null;
  blogEnabled: boolean;
  blogLabel: string;
  eventsLabel: string;
  children: ReactNode;
}

export function PublicBlogScreenNago({
  locale,
  dict,
  brand,
  sessionEmail,
  blogEnabled,
  blogLabel,
  eventsLabel,
  children,
}: PublicBlogScreenNagoProps) {
  return (
    <NagoFontRoot>
      <main className="relative min-h-screen overflow-x-hidden bg-[var(--nago-bg)]">
        <NagoSiteHeader
          locale={locale}
          logoSrc={resolveNagoLogo(brand)}
          logoAlt={brand.logoAlt}
          dict={dict}
          sessionEmail={sessionEmail}
          showBlogLink={blogEnabled}
          blogLabel={blogEnabled ? blogLabel : undefined}
          showEventsLink
          eventsLabel={eventsLabel}
          labels={nagoSiteHeaderLabels(dict)}
        />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <div className="nago-public-sheet rounded-2xl border border-[var(--nago-gold)]/20 bg-[var(--nago-bg-2)] p-4 md:p-6">
            {children}
          </div>
        </div>
        <PublicContentLanguageFooter
          locale={locale}
          labels={dict.common.locale}
        />
      </main>
    </NagoFontRoot>
  );
}
