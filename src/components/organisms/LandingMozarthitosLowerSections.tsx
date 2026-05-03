import type { Dictionary } from "@/types/i18n";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import { LandingMozarthitosContactSection } from "@/components/organisms/LandingMozarthitosContactSection";
import { LandingMozarthitosCursosSection } from "@/components/organisms/LandingMozarthitosCursosSection";
import { LandingMozarthitosSedesSection } from "@/components/organisms/LandingMozarthitosSedesSection";

export interface LandingMozarthitosLowerSectionsProps {
  dict: Dictionary;
  locale: string;
  imgOferta: (filename: string) => string;
  mapSrc: string;
  igUrl: string;
  marketingBrand?: MarketingLandingBrand;
}

export function LandingMozarthitosLowerSections({
  dict,
  locale,
  imgOferta,
  mapSrc,
  igUrl,
  marketingBrand = "mz",
}: LandingMozarthitosLowerSectionsProps) {
  return (
    <>
      <LandingMozarthitosCursosSection
        dict={dict}
        locale={locale}
        imgOferta={imgOferta}
        marketingBrand={marketingBrand}
      />
      <LandingMozarthitosSedesSection
        dict={dict}
        mapSrc={mapSrc}
        marketingBrand={marketingBrand}
      />
      <LandingMozarthitosContactSection
        dict={dict}
        igUrl={igUrl}
        marketingBrand={marketingBrand}
      />
    </>
  );
}
