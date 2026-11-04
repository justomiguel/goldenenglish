import { MusicaDosExperience } from "@/components/organisms/musica-dos/MusicaDosExperience";
import { GenericPhotos } from "@/components/organisms/generic-landing/GenericSlotLead";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { genericSectionNames } from "@/lib/landing/genericSectionNames";
import { genericSectionPhotos } from "@/lib/landing/genericSectionPhotos";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";

export function MusicaDosLanding({
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
    <GenericPhotos photos={genericSectionPhotos("musica2", mediaMap)}>
      <MusicaDosExperience
        copy={dict.landing.genericLandings.musica2}
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
