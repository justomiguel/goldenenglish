import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LioraSiteHeader } from "@/components/organisms/LioraSiteHeader";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";
import { PublicContentLanguageFooter } from "@/components/molecules/PublicContentLanguageFooter";

export interface PublicBlogScreenLioraProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  sessionEmail: string | null;
  blogEnabled: boolean;
  blogLabel: string;
  eventsLabel: string;
  children: ReactNode;
}

export function PublicBlogScreenLiora({
  locale,
  dict,
  brand,
  sessionEmail,
  blogEnabled,
  blogLabel,
  eventsLabel,
  children,
}: PublicBlogScreenLioraProps) {
  const t = (path: string) => marketingLandingCopy(dict, "liora", path);

  return (
    <LioraFontRoot>
      <main className="relative min-h-screen overflow-x-hidden bg-[var(--liora-cream)]">
        <LioraSiteHeader
          locale={locale}
          logoSrc={brand.logoPath}
          logoAlt={brand.logoAlt}
          dict={dict}
          sessionEmail={sessionEmail}
          showBlogLink={blogEnabled}
          blogLabel={blogEnabled ? blogLabel : undefined}
          showEventsLink
          eventsLabel={eventsLabel}
          instagramUrl={brand.socialInstagram}
          whatsappUrl={brand.socialWhatsapp}
          labels={{
            inicio: t("nav.inicio"),
            sobreNosotros: t("nav.sobreNosotros"),
            clases: t("nav.clases"),
            sedes: t("nav.sedes"),
            horarios: t("nav.horarios"),
            galeria: t("nav.galeria"),
            eventos: t("nav.eventos"),
            contacto: t("nav.contacto"),
            openMenu: t("chrome.openMenu"),
            closeMenu: t("chrome.closeMenu"),
          }}
        />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
        <PublicContentLanguageFooter
          locale={locale}
          labels={dict.common.locale}
        />
      </main>
    </LioraFontRoot>
  );
}
