import type { ComponentType } from "react";
import { createElement } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import type {
  LandingBlock,
  LandingSectionSlug,
  SiteThemeKind,
} from "@/types/theming";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";
import { LandingMainSectionsGeneric } from "@/components/organisms/LandingMainSectionsGeneric";
import { hiddenLandingSections } from "@/lib/theme/hiddenLandingSections";
import {
  genericSectionStockPath,
  isGenericInstituteKind,
  type GenericInstituteKind,
} from "@/lib/theme/genericInstituteTemplates";

export interface LandingMainSectionHostProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail?: string | null;
  mediaMap?: LandingMediaMap;
  blocksBySection?: Readonly<
    Record<LandingSectionSlug, ReadonlyArray<LandingBlock>>
  >;
  blogEnabled?: boolean;
  merchEnabled?: boolean;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
  /** Raw `site_themes.properties` overrides. Not the merged system defaults. */
  themeProperties?: Readonly<Record<string, string>>;
}

type LandingMainSectionComponent = ComponentType<LandingMainSectionHostProps>;

function contactFromOverrides(
  properties: Readonly<Record<string, string>> | undefined,
): {
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
} {
  return {
    email: properties?.["contact.email"]?.trim() ?? "",
    phone: properties?.["contact.phone"]?.trim() ?? "",
    address: properties?.["contact.address"]?.trim() ?? "",
    whatsapp: properties?.["social.whatsapp"]?.trim() ?? "",
  };
}

/**
 * Dynamic import so unused *FontRoot / next/font modules stay out of the
 * home graph. Only the active `templateKind` is preloaded.
 */
function bindGenericLanding(kind: GenericInstituteKind): LandingMainSectionComponent {
  function LandingMainSectionsGenericBound(props: LandingMainSectionHostProps) {
    return createElement(LandingMainSectionsGeneric, {
      copy: props.dict.landing.genericLandings[kind],
      locale: props.locale,
      kind,
      heroSrc: props.mediaMap?.get("inicio::1") ?? genericSectionStockPath(kind, "inicio"),
      sectionLabels: props.dict.landing.genericSectionLabels,
      hiddenSections: hiddenLandingSections(props.themeProperties),
      contact: contactFromOverrides(props.themeProperties),
      contactLabels: props.dict.landing.genericContact,
      sectionSrc: {
        historia: props.mediaMap?.get("historia::1") ?? genericSectionStockPath(kind, "historia"),
        oferta: props.mediaMap?.get("oferta::1") ?? genericSectionStockPath(kind, "oferta"),
        modalidades:
          props.mediaMap?.get("modalidades::1") ?? genericSectionStockPath(kind, "modalidades"),
        niveles: props.mediaMap?.get("niveles::1") ?? genericSectionStockPath(kind, "niveles"),
        certificaciones:
          props.mediaMap?.get("certificaciones::1") ??
          genericSectionStockPath(kind, "certificaciones"),
      },
    });
  }
  return LandingMainSectionsGenericBound;
}

export async function loadLandingMainSections(
  kind: SiteThemeKind,
): Promise<LandingMainSectionComponent> {
  if (isGenericInstituteKind(kind)) return bindGenericLanding(kind);
  switch (kind) {
    case "editorial":
      return (await import("@/components/organisms/LandingMainSectionsEditorial"))
        .LandingMainSectionsEditorial as LandingMainSectionComponent;
    case "minimal":
      return (await import("@/components/organisms/LandingMainSectionsMinimal"))
        .LandingMainSectionsMinimal as LandingMainSectionComponent;
    case "mozarthitos":
      return (await import("@/components/organisms/LandingMainSectionsMozarthitos"))
        .LandingMainSectionsMozarthitos as LandingMainSectionComponent;
    case "espaciozenit":
      return (await import("@/components/organisms/LandingMainSectionsEspacioZenit"))
        .LandingMainSectionsEspacioZenit as LandingMainSectionComponent;
    case "nago":
      return (await import("@/components/organisms/LandingMainSectionsNago"))
        .LandingMainSectionsNago as LandingMainSectionComponent;
    case "mimundo":
      return (await import("@/components/organisms/LandingMainSectionsMimundo"))
        .LandingMainSectionsMimundo as LandingMainSectionComponent;
    case "liora":
      return (await import("@/components/organisms/LandingMainSectionsLiora"))
        .LandingMainSectionsLiora as LandingMainSectionComponent;
    default:
      return (await import("@/components/organisms/LandingMainSections"))
        .LandingMainSections as LandingMainSectionComponent;
  }
}
