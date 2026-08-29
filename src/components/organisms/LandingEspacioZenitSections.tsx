import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { LandingEspacioZenitDisciplinasSection } from "@/components/organisms/LandingEspacioZenitDisciplinasSection";
import { LandingEspacioZenitEnrollmentBanner } from "@/components/organisms/LandingEspacioZenitEnrollmentBanner";
import { LandingEspacioZenitFooter } from "@/components/organisms/LandingEspacioZenitFooter";
import { LandingEspacioZenitHeroMockup } from "@/components/organisms/LandingEspacioZenitHeroMockup";
import { LandingEspacioZenitPillarsBar } from "@/components/organisms/LandingEspacioZenitPillarsBar";
import { EspacioZenitLandingGallery } from "@/components/organisms/EspacioZenitLandingGallery";
import { EZ_OFERTA_ENROLLMENT_SRC } from "@/lib/landing/espacioZenitLandingMedia";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

export interface LandingEspacioZenitSectionsProps {
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  mediaMap?: LandingMediaMap;
  logoSrc: string;
  logoAlt: string;
  brand: BrandPublic;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

export function LandingEspacioZenitSections({
  dict,
  locale,
  sessionEmail,
  mediaMap,
  logoSrc,
  logoAlt,
  brand,
  publicCtaMode,
  inscriptionsEnabled,
}: LandingEspacioZenitSectionsProps) {
  const enrollmentPhoto = mediaMap?.get("oferta::1") ?? EZ_OFERTA_ENROLLMENT_SRC;

  return (
    <>
      <LandingEspacioZenitHeroMockup
        dict={dict}
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        publicCtaMode={publicCtaMode}
        inscriptionsEnabled={inscriptionsEnabled}
      />
      <LandingEspacioZenitDisciplinasSection dict={dict} locale={locale} />
      <LandingEspacioZenitPillarsBar dict={dict} />
      <LandingEspacioZenitEnrollmentBanner
        dict={dict}
        locale={locale}
        studioPhotoSrc={enrollmentPhoto}
        publicCtaMode={publicCtaMode}
        inscriptionsEnabled={inscriptionsEnabled}
      />
      <EspacioZenitLandingGallery dict={dict} />
      <LandingEspacioZenitFooter
        dict={dict}
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        brand={brand}
        sessionEmail={sessionEmail}
      />
    </>
  );
}
