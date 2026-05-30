import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NagoSiteHeader } from "@/components/organisms/NagoSiteHeader";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";

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
      <main className="relative min-h-screen overflow-x-hidden bg-white">
        <NagoSiteHeader
          locale={locale}
          logoSrc={brand.logoPath}
          logoAlt={brand.logoAlt}
          dict={dict}
          sessionEmail={sessionEmail}
          showBlogLink={blogEnabled}
          blogLabel={blogEnabled ? blogLabel : undefined}
          showEventsLink
          eventsLabel={eventsLabel}
          labels={{
            inicio: marketingLandingCopy(dict, "nago", "nav.inicio"),
            sobreNosotros: marketingLandingCopy(dict, "nago", "nav.sobreNosotros"),
            clases: marketingLandingCopy(dict, "nago", "nav.clases"),
            galeria: marketingLandingCopy(dict, "nago", "nav.galeria"),
            eventos: marketingLandingCopy(dict, "nago", "nav.eventos"),
            contacto: marketingLandingCopy(dict, "nago", "nav.contacto"),
            openMenu: marketingLandingCopy(dict, "nago", "chrome.openMenu"),
            closeMenu: marketingLandingCopy(dict, "nago", "chrome.closeMenu"),
          }}
        />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
      </main>
    </NagoFontRoot>
  );
}
