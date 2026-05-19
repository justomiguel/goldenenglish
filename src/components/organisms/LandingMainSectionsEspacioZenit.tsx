import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveEspacioZenitHeaderLogo } from "@/lib/landing/resolveEspacioZenitHeaderLogo";
import { EspacioZenitSiteHeader } from "@/components/organisms/EspacioZenitSiteHeader";
import { LandingEspacioZenitSections } from "@/components/organisms/LandingEspacioZenitSections";
import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";

interface LandingMainSectionsEspacioZenitProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  mediaMap?: LandingMediaMap;
}

export function LandingMainSectionsEspacioZenit({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
}: LandingMainSectionsEspacioZenitProps) {
  const logoSrc = resolveEspacioZenitHeaderLogo(brand, mediaMap);

  return (
    <EspacioZenitFontRoot className="relative max-w-[100vw] overflow-x-hidden bg-black">
      <main className="relative overflow-x-hidden">
        <EspacioZenitSiteHeader
          locale={locale}
          logoSrc={logoSrc}
          logoAlt={brand.logoAlt}
          brandDisplayName={brand.name}
          dict={dict}
          sessionEmail={sessionEmail}
        />
        <LandingEspacioZenitSections
          dict={dict}
          locale={locale}
          sessionEmail={sessionEmail}
          mediaMap={mediaMap}
          logoSrc={logoSrc}
          logoAlt={brand.logoAlt}
          brand={brand}
        />
      </main>
    </EspacioZenitFontRoot>
  );
}
