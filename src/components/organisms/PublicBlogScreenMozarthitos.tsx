import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";
import { MozarthitosSiteHeader } from "@/components/organisms/MozarthitosSiteHeader";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";

export interface PublicBlogScreenMozarthitosProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail: string | null;
  blogEnabled: boolean;
  merchEnabled?: boolean;
  blogLabel: string;
  eventsLabel: string;
  mediaMap?: LandingMediaMap;
  children: ReactNode;
}

export function PublicBlogScreenMozarthitos({
  locale,
  dict,
  brand,
  sessionEmail,
  blogEnabled,
  merchEnabled = false,
  blogLabel,
  eventsLabel,
  mediaMap,
  children,
}: PublicBlogScreenMozarthitosProps) {
  const logoSrc = brand.logoPath;
  void mediaMap;
  const logoWidth = 1024;
  const logoHeight = 256;

  return (
    <MozarthitosFontRoot className="relative min-h-screen">
      <main className="relative overflow-x-hidden">
        <MozarthitosSiteHeader
          locale={locale}
          logoSrc={logoSrc}
          logoAlt={brand.logoAlt}
          logoWidth={logoWidth}
          logoHeight={logoHeight}
          dict={dict}
          sessionEmail={sessionEmail}
          showBlogLink={blogEnabled}
          blogLabel={blogEnabled ? blogLabel : undefined}
          showEventsLink
          eventsLabel={eventsLabel}
          showShopLink={merchEnabled}
          shopLabel={merchEnabled ? dict.shop.catalog.title : undefined}
          labels={{
            inicio: marketingLandingCopy(dict, "mz", "nav.inicio"),
            quienes: marketingLandingCopy(dict, "mz", "nav.quienes"),
            cursos: marketingLandingCopy(dict, "mz", "nav.cursos"),
            sedes: marketingLandingCopy(dict, "mz", "nav.sedes"),
            contacto: marketingLandingCopy(dict, "mz", "nav.contacto"),
            openMenu: marketingLandingCopy(dict, "mz", "chrome.openMenu"),
            closeMenu: marketingLandingCopy(dict, "mz", "chrome.closeMenu"),
          }}
        />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
        <PublicContentLanguageFooter
          locale={locale}
          labels={dict.common.locale}
          variant="compactDark"
          tone="dark"
        />
      </main>
    </MozarthitosFontRoot>
  );
}
