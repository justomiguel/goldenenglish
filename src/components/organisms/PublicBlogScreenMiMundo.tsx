import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MiMundoSiteHeader } from "@/components/organisms/MiMundoSiteHeader";

export interface PublicBlogScreenMiMundoProps {
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

export function PublicBlogScreenMiMundo({
  locale,
  dict,
  brand,
  sessionEmail,
  blogEnabled,
  blogLabel,
  eventsLabel,
  children,
}: PublicBlogScreenMiMundoProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--color-background)]">
      <MiMundoSiteHeader
        locale={locale}
        logoSrc={brand.logoPath}
        logoAlt={brand.logoAlt}
        dict={dict}
        sessionEmail={sessionEmail}
        socialFacebook={brand.socialFacebook}
        socialInstagram={brand.socialInstagram}
        showBlogLink={blogEnabled}
        blogLabel={blogEnabled ? blogLabel : undefined}
        showEventsLink
        eventsLabel={eventsLabel}
        labels={{
          inicio: marketingLandingCopy(dict, "mm", "nav.inicio"),
          propuesta: marketingLandingCopy(dict, "mm", "nav.propuesta"),
          salas: marketingLandingCopy(dict, "mm", "nav.salas"),
          galeria: marketingLandingCopy(dict, "mm", "nav.galeria"),
          contacto: marketingLandingCopy(dict, "mm", "nav.contacto"),
          openMenu: marketingLandingCopy(dict, "mm", "chrome.openMenu"),
          closeMenu: marketingLandingCopy(dict, "mm", "chrome.closeMenu"),
          login: dict.login.title,
          reservar: marketingLandingCopy(dict, "mm", "nav.reservar"),
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </main>
  );
}
