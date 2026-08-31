import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { NagoSiteHeader } from "@/components/organisms/NagoSiteHeader";
import { LandingNagoSections } from "@/components/organisms/LandingNagoSections";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { nagoSiteHeaderLabels } from "@/lib/landing/nagoSiteHeaderLabels";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";
import { resolveNagoLogo } from "@/lib/landing/nagoLogo";
import { nagoLandingRegisterCtas } from "@/lib/landing/nagoLandingRegisterCtas";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

interface LandingMainSectionsNagoProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  mediaMap?: LandingMediaMap;
  blogEnabled?: boolean;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

export function LandingMainSectionsNago({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
  blogEnabled = false,
  publicCtaMode,
  inscriptionsEnabled,
}: LandingMainSectionsNagoProps) {
  const logoSrc = resolveNagoLogo(brand);
  const registerCtas = nagoLandingRegisterCtas({
    locale,
    dict,
    publicCtaMode,
    inscriptionsEnabled,
  });

  return (
    <NagoFontRoot>
      <NagoSiteHeader
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={brand.logoAlt}
        dict={dict}
        sessionEmail={sessionEmail}
        overlayHero
        showBlogLink={blogEnabled}
        blogLabel={blogEnabled ? dict.blog.list.title : undefined}
        showEventsLink
        eventsLabel={marketingLandingCopy(dict, "nago", "nav.eventos")}
        labels={nagoSiteHeaderLabels(dict)}
        registerCtas={registerCtas}
      />
      <main className="relative overflow-x-hidden">
        <LandingNagoSections
          dict={dict}
          brand={brand}
          locale={locale}
          mediaMap={mediaMap}
          registerCtas={registerCtas}
        />
      </main>
    </NagoFontRoot>
  );
}
