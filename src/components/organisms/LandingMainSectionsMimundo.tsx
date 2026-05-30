import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MiMundoFontRoot } from "@/components/organisms/MiMundoFontRoot";
import { MiMundoSiteHeader } from "@/components/organisms/MiMundoSiteHeader";
import { LandingMimundoSections } from "@/components/organisms/LandingMimundoSections";

interface LandingMainSectionsMimundoProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  mediaMap?: LandingMediaMap;
  blogEnabled?: boolean;
}

export function LandingMainSectionsMimundo({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
  blogEnabled = false,
}: LandingMainSectionsMimundoProps) {
  const t = (path: string) => marketingLandingCopy(dict, "mm", path);

  return (
    <MiMundoFontRoot>
      <main className="relative overflow-x-hidden">
        <MiMundoSiteHeader
          locale={locale}
          logoSrc={brand.logoPath}
          logoAlt={brand.logoAlt}
          dict={dict}
          sessionEmail={sessionEmail}
          socialFacebook={brand.socialFacebook}
          socialInstagram={brand.socialInstagram}
          showBlogLink={blogEnabled}
          blogLabel={blogEnabled ? dict.blog.list.title : undefined}
          showEventsLink
          eventsLabel={dict.events.public.title}
          labels={{
            inicio: t("nav.inicio"),
            propuesta: t("nav.propuesta"),
            salas: t("nav.salas"),
            galeria: t("nav.galeria"),
            contacto: t("nav.contacto"),
            openMenu: t("chrome.openMenu"),
            closeMenu: t("chrome.closeMenu"),
            login: dict.nav.login,
            reservar: t("hero.ctaReservar"),
          }}
        />
        <LandingMimundoSections
          dict={dict}
          brand={brand}
          locale={locale}
          mediaMap={mediaMap}
        />
      </main>
    </MiMundoFontRoot>
  );
}
