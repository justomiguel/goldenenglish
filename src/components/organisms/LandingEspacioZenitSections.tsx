import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { LandingEspacioZenitDisciplinasSection } from "@/components/organisms/LandingEspacioZenitDisciplinasSection";
import { LandingEspacioZenitEnrollmentBanner } from "@/components/organisms/LandingEspacioZenitEnrollmentBanner";
import { LandingEspacioZenitFooter } from "@/components/organisms/LandingEspacioZenitFooter";
import { LandingEspacioZenitHeroMockup } from "@/components/organisms/LandingEspacioZenitHeroMockup";
import { LandingEspacioZenitPillarsBar } from "@/components/organisms/LandingEspacioZenitPillarsBar";
import { LandingEspacioZenitPlaceholderRail } from "@/components/organisms/LandingEspacioZenitPlaceholderRail";

export interface LandingEspacioZenitSectionsProps {
  dict: Dictionary;
  locale: string;
  mediaMap?: LandingMediaMap;
  logoSrc: string;
  logoAlt: string;
  brand: BrandPublic;
}

export function LandingEspacioZenitSections({
  dict,
  locale,
  mediaMap,
  logoSrc,
  logoAlt,
  brand,
}: LandingEspacioZenitSectionsProps) {
  const enrollmentPhoto = mediaMap?.get("oferta::1");

  return (
    <>
      <LandingEspacioZenitHeroMockup
        dict={dict}
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
      />
      <LandingEspacioZenitDisciplinasSection dict={dict} locale={locale} />
      <LandingEspacioZenitPillarsBar dict={dict} />
      <LandingEspacioZenitEnrollmentBanner
        dict={dict}
        locale={locale}
        studioPhotoSrc={enrollmentPhoto}
      />
      <LandingEspacioZenitPlaceholderRail dict={dict} />
      <LandingEspacioZenitFooter
        dict={dict}
        locale={locale}
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        brand={brand}
      />
    </>
  );
}
