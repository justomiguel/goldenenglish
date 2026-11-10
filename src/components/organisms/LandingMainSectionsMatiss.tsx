import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { resolveLandingImageSrcForTheme, type LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import type { LandingImageSectionSlug } from "@/lib/landing/sectionLandingImages";
import { MatissFontRoot } from "@/components/organisms/MatissFontRoot";
import { LandingMatissExperience } from "@/components/organisms/LandingMatissExperience";
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
  const img = (section: LandingImageSectionSlug, n: number) =>
    resolveLandingImageSrcForTheme("matiss", section, `${n}.jpg`, mediaMap);
  const prefix = `/${locale}`;
  const links = [
    { href: `${prefix}#sobre`, label: t("nav.sobreNosotros") },
    { href: `${prefix}#clases`, label: t("nav.clases") },
    { href: `${prefix}#horarios`, label: t("nav.horarios") },
    { href: `${prefix}#galeria`, label: t("nav.galeria") },
    { href: `${prefix}#sedes`, label: t("nav.sedes") },
    { href: `${prefix}#preguntas`, label: t("nav.preguntas") },
    { href: `${prefix}#contacto`, label: t("nav.contacto") },
  ];

  return (
    <MatissFontRoot>
      <LandingMatissExperience
        dict={dict}
        brand={brand}
        locale={locale}
        links={links}
        sessionEmail={sessionEmail}
        openMenu={t("chrome.openMenu")}
        closeMenu={t("chrome.closeMenu")}
        images={{
          heroWeb: img("inicio", 2),
          manifesto: img("historia", 1),
          benefits: img("historia", 2),
          programs: [1, 2, 3].map((n) => img("niveles", n)),
          classes: [1, 2, 3, 4].map((n) => img("oferta", n)),
          gala: img("modalidades", 2),
          gallery: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => img("certificaciones", n)),
          contact: img("modalidades", 1),
        }}
        publicCtaMode={publicCtaMode}
        inscriptionsEnabled={inscriptionsEnabled}
      />
    </MatissFontRoot>
  );
}
