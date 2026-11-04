import { DeportesDosExperience } from "@/components/organisms/deportes-dos/DeportesDosExperience";
import { GenericPhotos } from "@/components/organisms/generic-landing/GenericSlotLead";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { genericSectionNames } from "@/lib/landing/genericSectionNames";
import { genericSectionPhotos } from "@/lib/landing/genericSectionPhotos";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";

export function DeportesDosLanding({
  dict,
  brand,
  locale,
  mediaMap,
}: {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  mediaMap?: LandingMediaMap;
}) {
  return (
    <GenericPhotos photos={genericSectionPhotos("deportes2", mediaMap)}>
    <DeportesDosExperience
      copy={dict.landing.genericLandings.deportes2}
      locale={locale}
      siteName={brand.name}
      mailTo={brand.contactEmail}
      contactLabels={dict.landing.genericContact}
      menu={genericSectionNames(dict)}
      sectionLabels={dict.landing.genericSectionLabels}
    />
    </GenericPhotos>
  );
}
