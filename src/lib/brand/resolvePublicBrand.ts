import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/types/i18n";
import { loadNeedsInitialSiteSetup } from "@/lib/site/loadNeedsInitialSiteSetup";
import { getBrandForRequest, type BrandPublic } from "@/lib/brand/server";
import { neutralBrandForGreenfield } from "@/lib/brand/neutralBrandForGreenfield";

export type PublicBrandWithSetup = {
  brand: BrandPublic;
  needsInitialSiteSetup: boolean;
  dict: Dictionary;
};

/**
 * Brand + setup flag for marketing/auth shells. When initial site setup is
 * pending, omits Golden-template identity from `system.properties`.
 */
export const resolvePublicBrandWithSetup = cache(
  async (locale: AppLocale): Promise<PublicBrandWithSetup> => {
    const dict = await getDictionary(locale);
    const supabase = await createClient();
    const needsInitialSiteSetup = await loadNeedsInitialSiteSetup(supabase);
    const brand = needsInitialSiteSetup
      ? neutralBrandForGreenfield(dict)
      : await getBrandForRequest();
    return { brand, needsInitialSiteSetup, dict };
  },
);

export async function resolvePublicBrand(locale: AppLocale): Promise<BrandPublic> {
  const { brand } = await resolvePublicBrandWithSetup(locale);
  return brand;
}
