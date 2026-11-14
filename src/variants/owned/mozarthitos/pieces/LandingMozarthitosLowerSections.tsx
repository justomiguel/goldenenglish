import type { Dictionary } from "@/types/i18n";
import type { MarketingLandingBrand } from "@/lib/landing/mzLandingCopy";
import { LandingMozarthitosContactSection } from "@/variants/owned/mozarthitos/pieces/LandingMozarthitosContactSection";
import { LandingMozarthitosCursosSection } from "@/variants/owned/mozarthitos/pieces/LandingMozarthitosCursosSection";
import { LandingMozarthitosSedesSection } from "@/variants/owned/mozarthitos/pieces/LandingMozarthitosSedesSection";

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
        locale={locale}
        igUrl={igUrl}
        marketingBrand={marketingBrand}
      />
    </>
  );
}
