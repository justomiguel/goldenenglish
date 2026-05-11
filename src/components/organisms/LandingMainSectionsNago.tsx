import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { NagoSiteHeader } from "@/components/organisms/NagoSiteHeader";
import { LandingNagoSections } from "@/components/organisms/LandingNagoSections";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";

interface LandingMainSectionsNagoProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  mediaMap?: LandingMediaMap;
}

export function LandingMainSectionsNago({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
}: LandingMainSectionsNagoProps) {
  const logoSrc = brand.logoPath;

  return (
    <NagoFontRoot>
      <main className="relative overflow-x-hidden">
        <NagoSiteHeader
          locale={locale}
          logoSrc={logoSrc}
          logoAlt={brand.logoAlt}
          dict={dict}
          sessionEmail={sessionEmail}
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
        <LandingNagoSections
          dict={dict}
          brand={brand}
          locale={locale}
          mediaMap={mediaMap}
        />
      </main>
    </NagoFontRoot>
  );
}
