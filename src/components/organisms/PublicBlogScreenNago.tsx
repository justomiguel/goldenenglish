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
  merchEnabled?: boolean;
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
  merchEnabled = false,
  blogLabel,
  eventsLabel,
  children,
}: PublicBlogScreenNagoProps) {
  return (
    <NagoFontRoot>
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
        showShopLink={merchEnabled}
        shopLabel={merchEnabled ? dict.shop.catalog.title : undefined}
        labels={nagoSiteHeaderLabels(dict)}
      />
      <main className="relative min-h-screen overflow-x-hidden bg-[var(--nago-bg)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
        <PublicContentLanguageFooter
          locale={locale}
          labels={dict.common.locale}
        />
      </main>
    </NagoFontRoot>
  );
}
