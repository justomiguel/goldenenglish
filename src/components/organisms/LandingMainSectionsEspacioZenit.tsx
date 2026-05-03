import localFont from "next/font/local";
import { Bebas_Neue, Cormorant_Garamond, Pacifico, Plus_Jakarta_Sans } from "next/font/google";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";
import { EspacioZenitSiteHeader } from "@/components/organisms/EspacioZenitSiteHeader";
import { LandingEspacioZenitSections } from "@/components/organisms/LandingEspacioZenitSections";
import "@/styles/mozarthitosLanding.css";
import "@/styles/espaciozenitLanding.css";

/** Hero headline brush script (`public/fonts/FAST BLAZE.otf`). */
const ezHeroBrush = localFont({
  src: "../../../public/fonts/FAST BLAZE.otf",
  variable: "--font-ez-fast-blaze",
  display: "swap",
});

/** Discipline card — Hip Hop title (`public/fonts/Rusted Vibe.otf`). */
const ezDisciplineHiphop = localFont({
  src: "../../../public/fonts/Rusted Vibe.otf",
  variable: "--font-ez-rusted-vibe",
  display: "swap",
});

/** Discipline card — Ballet title (`public/fonts/Ballet.otf`). */
const ezDisciplineBallet = localFont({
  src: "../../../public/fonts/Ballet.otf",
  variable: "--font-ez-ballet-display",
  display: "swap",
});

const ezBrush = Pacifico({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-ez-brush",
  display: "swap",
  adjustFontFallback: true,
});

const ezSerif = Cormorant_Garamond({
  weight: ["500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-ez-serif",
  display: "swap",
  adjustFontFallback: true,
});

const ezDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-ez-display",
  display: "swap",
  adjustFontFallback: true,
});

const ezBody = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-ez-body",
  display: "swap",
});

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
  const bundledHeaderLogo = resolveLandingImageSrcForTheme(
    "espaciozenit",
    "inicio",
    "1.png",
    mediaMap,
  );
  const lp = brand.logoPath.trim();
  const genericBundledLogo =
    lp === "/images/logo.png" || /(^|\/)images\/logo\.png$/i.test(lp);
  const logoSrc = genericBundledLogo ? bundledHeaderLogo : brand.logoPath;

  return (
    <main
      className={`ez-landing mz-landing relative max-w-[100vw] overflow-x-hidden bg-black ${ezHeroBrush.variable} ${ezDisciplineHiphop.variable} ${ezDisciplineBallet.variable} ${ezBrush.variable} ${ezSerif.variable} ${ezDisplay.variable} ${ezBody.variable}`}
    >
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
        mediaMap={mediaMap}
        logoSrc={logoSrc}
        logoAlt={brand.logoAlt}
        brand={brand}
      />
    </main>
  );
}
