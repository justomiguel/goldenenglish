import { Bebas_Neue, DM_Sans } from "next/font/google";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { NagoSiteHeader } from "@/components/organisms/NagoSiteHeader";
import { LandingNagoSections } from "@/components/organisms/LandingNagoSections";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import "@/styles/nagoLanding.css";

const nagoDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-nago-display",
  display: "swap",
  adjustFontFallback: true,
});

const nagoBody = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-nago-body",
  display: "swap",
  adjustFontFallback: true,
});

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
  /** Same source as layout / admin: `site_themes.properties.app.logo.path` (+ Storage resolution). */
  const logoSrc = brand.logoPath;

  return (
    <main
      className={`nago-landing ${nagoDisplay.variable} ${nagoBody.variable} bg-[var(--color-background)] font-[family-name:var(--font-nago-body)] text-[var(--nago-ink)] antialiased`}
    >
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
      <LandingNagoSections dict={dict} brand={brand} locale={locale} mediaMap={mediaMap} />
    </main>
  );
}
