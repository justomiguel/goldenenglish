import { Baloo_2, DM_Sans } from "next/font/google";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { MozarthitosSiteHeader } from "@/components/organisms/MozarthitosSiteHeader";
import { LandingMozarthitosSections } from "@/components/organisms/LandingMozarthitosSections";
import { mzLandingCopy } from "@/lib/landing/mzLandingCopy";
import "@/styles/mozarthitosLanding.css";

const mzDisplay = Baloo_2({
  weight: ["400", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-mz-display",
  display: "swap",
});

const mzBody = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-mz-body",
  display: "swap",
});

interface LandingMainSectionsMozarthitosProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  inscriptionsOpen: boolean;
  mediaMap?: LandingMediaMap;
}

export function LandingMainSectionsMozarthitos({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
}: LandingMainSectionsMozarthitosProps) {
  const logoSrc = resolveLandingImageSrcForTheme(
    "mozarthitos",
    "inicio",
    "1.png",
    mediaMap,
  );

  return (
    <main
      className={`mz-landing relative max-w-[100vw] overflow-x-hidden bg-[var(--mz-white)] ${mzDisplay.variable} ${mzBody.variable}`}
    >
      <MozarthitosSiteHeader
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={brand.logoAlt}
        logoWidth={1024}
        logoHeight={303}
        dict={dict}
        sessionEmail={sessionEmail}
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
      />
    </main>
  );
}
