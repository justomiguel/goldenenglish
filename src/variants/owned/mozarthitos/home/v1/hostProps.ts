import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { mzLandingCopy } from "@/lib/landing/mzLandingCopy";
import type { Dictionary } from "@/types/i18n";

export interface MozarthitosHomeHostInput {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail?: string | null;
  mediaMap?: LandingMediaMap;
  blogEnabled?: boolean;
  merchEnabled?: boolean;
}

export interface MozarthitosHomeLabels {
  inicio: string;
  quienes: string;
  cursos: string;
  sedes: string;
  contacto: string;
  openMenu: string;
  closeMenu: string;
}

export interface MozarthitosHomeProps extends MozarthitosHomeHostInput {
  blogEnabled: boolean;
  merchEnabled: boolean;
  eventsLabel: string;
  blogLabel?: string;
  shopLabel?: string;
  labels: MozarthitosHomeLabels;
}

export function buildMozarthitosHomeProps(input: MozarthitosHomeHostInput): MozarthitosHomeProps {
  const blogEnabled = input.blogEnabled ?? false;
  const merchEnabled = input.merchEnabled ?? false;
  return {
    ...input,
    blogEnabled,
    merchEnabled,
    eventsLabel: input.dict.events?.public?.title ?? "",
    blogLabel: blogEnabled ? input.dict.blog?.list?.title : undefined,
    shopLabel: merchEnabled ? input.dict.shop?.catalog?.title : undefined,
    labels: {
      inicio: mzLandingCopy(input.dict, "nav.inicio"),
      quienes: mzLandingCopy(input.dict, "nav.quienes"),
      cursos: mzLandingCopy(input.dict, "nav.cursos"),
      sedes: mzLandingCopy(input.dict, "nav.sedes"),
      contacto: mzLandingCopy(input.dict, "nav.contacto"),
      openMenu: mzLandingCopy(input.dict, "chrome.openMenu"),
      closeMenu: mzLandingCopy(input.dict, "chrome.closeMenu"),
    },
  };
}
