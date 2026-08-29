import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { MozarthitosSiteHeader } from "@/components/organisms/MozarthitosSiteHeader";
import { LandingMozarthitosSections } from "@/components/organisms/LandingMozarthitosSections";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";
import { mzLandingCopy } from "@/lib/landing/mzLandingCopy";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

interface LandingMainSectionsMozarthitosProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  mediaMap?: LandingMediaMap;
  blogEnabled?: boolean;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

export function LandingMainSectionsMozarthitos({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
  blogEnabled = false,
  publicCtaMode,
  inscriptionsEnabled,
}: LandingMainSectionsMozarthitosProps) {
  const logoSrc = resolveLandingImageSrcForTheme(
    "mozarthitos",
    "inicio",
    "1.png",
    mediaMap,
  );

  return (
    <MozarthitosFontRoot>
      <main className="relative overflow-x-hidden">
        <MozarthitosSiteHeader
          locale={locale}
          logoSrc={logoSrc}
          logoAlt={brand.logoAlt}
          logoWidth={1024}
          logoHeight={303}
          dict={dict}
          sessionEmail={sessionEmail}
          showBlogLink={blogEnabled}
          blogLabel={blogEnabled ? dict.blog.list.title : undefined}
          showEventsLink
          eventsLabel={dict.events.public.title}
          labels={{
            inicio: mzLandingCopy(dict, "nav.inicio"),
            quienes: mzLandingCopy(dict, "nav.quienes"),
            cursos: mzLandingCopy(dict, "nav.cursos"),
            sedes: mzLandingCopy(dict, "nav.sedes"),
            contacto: mzLandingCopy(dict, "nav.contacto"),
            openMenu: mzLandingCopy(dict, "chrome.openMenu"),
            closeMenu: mzLandingCopy(dict, "chrome.closeMenu"),
          }}
        />
        <LandingMozarthitosSections
          dict={dict}
          locale={locale}
          mediaMap={mediaMap}
          publicCtaMode={publicCtaMode}
          inscriptionsEnabled={inscriptionsEnabled}
        />
      </main>
    </MozarthitosFontRoot>
  );
}
