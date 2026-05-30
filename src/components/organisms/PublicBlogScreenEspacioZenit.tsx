import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { EspacioZenitSiteHeader } from "@/components/organisms/EspacioZenitSiteHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";

export interface PublicBlogScreenEspacioZenitProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail: string | null;
  blogEnabled: boolean;
  blogLabel: string;
  eventsLabel: string;
  mediaMap?: LandingMediaMap;
  children: ReactNode;
}

export function PublicBlogScreenEspacioZenit({
  locale,
  dict,
  brand,
  sessionEmail,
  blogEnabled,
  blogLabel,
  eventsLabel,
  children,
}: PublicBlogScreenEspacioZenitProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <EspacioZenitSiteHeader
        locale={locale}
        logoSrc={brand.logoPath}
        logoAlt={brand.logoAlt}
        brandDisplayName={brand.name}
        dict={dict}
        sessionEmail={sessionEmail}
        showBlogLink={blogEnabled}
        blogLabel={blogEnabled ? blogLabel : undefined}
        showEventsLink
        eventsLabel={eventsLabel}
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
      <PublicContentLanguageFooter
        locale={locale}
        labels={dict.common.locale}
        variant="compactDark"
        tone="dark"
      />
    </main>
  );
}
