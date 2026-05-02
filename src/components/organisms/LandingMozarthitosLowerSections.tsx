import type { Dictionary } from "@/types/i18n";
import { LandingMozarthitosContactSection } from "@/components/organisms/LandingMozarthitosContactSection";
import { LandingMozarthitosCursosSection } from "@/components/organisms/LandingMozarthitosCursosSection";
import { LandingMozarthitosSedesSection } from "@/components/organisms/LandingMozarthitosSedesSection";

export interface LandingMozarthitosLowerSectionsProps {
  dict: Dictionary;
  locale: string;
  imgOferta: (filename: string) => string;
  mapSrc: string;
  igUrl: string;
}

export function LandingMozarthitosLowerSections({
  dict,
  locale,
  imgOferta,
  mapSrc,
  igUrl,
}: LandingMozarthitosLowerSectionsProps) {
  return (
    <>
      <LandingMozarthitosCursosSection
        dict={dict}
        locale={locale}
        imgOferta={imgOferta}
      />
      <LandingMozarthitosSedesSection dict={dict} mapSrc={mapSrc} />
      <LandingMozarthitosContactSection dict={dict} igUrl={igUrl} />
    </>
  );
}
