import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";
import type { Dictionary } from "@/types/i18n";

export interface LioraHomeHostInput {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail?: string | null;
  mediaMap?: LandingMediaMap;
  blogEnabled?: boolean;
  merchEnabled?: boolean;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

export interface LioraHomeLabels {
  inicio: string;
  sobreNosotros: string;
  clases: string;
  sedes: string;
  horarios: string;
  galeria: string;
  eventos: string;
  contacto: string;
  openMenu: string;
  closeMenu: string;
}

export interface LioraHomeProps extends LioraHomeHostInput {
  blogEnabled: boolean;
  merchEnabled: boolean;
  eventsLabel: string;
  blogLabel?: string;
  shopLabel?: string;
  labels: LioraHomeLabels;
}

export function buildLioraHomeProps(input: LioraHomeHostInput): LioraHomeProps {
  const t = (path: string) => marketingLandingCopy(input.dict, "liora", path);
  const blogEnabled = input.blogEnabled ?? false;
  const merchEnabled = input.merchEnabled ?? false;
  return {
    ...input,
    blogEnabled,
    merchEnabled,
    eventsLabel: t("nav.eventos"),
    blogLabel: blogEnabled ? input.dict.blog.list.title : undefined,
    shopLabel: merchEnabled ? input.dict.shop.catalog.title : undefined,
    labels: {
      inicio: t("nav.inicio"),
      sobreNosotros: t("nav.sobreNosotros"),
      clases: t("nav.clases"),
      sedes: t("nav.sedes"),
      horarios: t("nav.horarios"),
      galeria: t("nav.galeria"),
      eventos: t("nav.eventos"),
      contacto: t("nav.contacto"),
      openMenu: t("chrome.openMenu"),
      closeMenu: t("chrome.closeMenu"),
    },
  };
}
