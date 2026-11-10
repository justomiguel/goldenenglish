import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { resolveLandingImageSrcForTheme, type LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MatissFontRoot } from "@/components/organisms/MatissFontRoot";
import { MatissSiteHeader } from "@/components/organisms/MatissSiteHeader";
import { LandingMatissSections } from "@/components/organisms/LandingMatissSections";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

interface LandingMainSectionsMatissProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  mediaMap?: LandingMediaMap;
  blogEnabled?: boolean;
  merchEnabled?: boolean;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

export function LandingMainSectionsMatiss({
  dict,
  brand,
  locale,
  sessionEmail,
  mediaMap,
  publicCtaMode,
  inscriptionsEnabled,
}: LandingMainSectionsMatissProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  const prefix = `/${locale}`;
  const links = [
    { href: `${prefix}#sobre`, label: t("nav.sobreNosotros") },
    { href: `${prefix}#clases`, label: t("nav.clases") },
    { href: `${prefix}#horarios`, label: t("nav.horarios") },
    { href: `${prefix}#sedes`, label: t("nav.sedes") },
    { href: `${prefix}#galeria`, label: t("nav.galeria") },
    { href: `${prefix}#contacto`, label: t("nav.contacto") },
  ];

  return (
    <MatissFontRoot>
      <main className="relative overflow-x-hidden">
        <MatissSiteHeader
          locale={locale}
          logoSrc={brand.logoPath}
          logoAlt={brand.logoAlt}
          dict={dict}
          sessionEmail={sessionEmail}
          links={links}
          openMenu={t("chrome.openMenu")}
          closeMenu={t("chrome.closeMenu")}
        />
        <LandingMatissSections
          dict={dict}
          brand={brand}
          locale={locale}
          links={links}
          images={{
            heroWeb: resolveLandingImageSrcForTheme("matiss", "inicio", "2.jpg", mediaMap),
            manifesto: resolveLandingImageSrcForTheme("matiss", "modalidades", "1.jpg", mediaMap),
            ageSmall: resolveLandingImageSrcForTheme("matiss", "niveles", "1.jpg", mediaMap),
            ageBig: resolveLandingImageSrcForTheme("matiss", "niveles", "2.jpg", mediaMap),
            about: resolveLandingImageSrcForTheme("matiss", "historia", "1.jpg", mediaMap),
            classes: [1, 2, 3, 4].map((n) =>
              resolveLandingImageSrcForTheme("matiss", "oferta", `${n}.jpg`, mediaMap),
            ),
            gallery: [1, 2, 3].map((n) =>
              resolveLandingImageSrcForTheme("matiss", "certificaciones", `${n}.jpg`, mediaMap),
            ),
          }}
          publicCtaMode={publicCtaMode}
          inscriptionsEnabled={inscriptionsEnabled}
        />
      </main>
    </MatissFontRoot>
  );
}
