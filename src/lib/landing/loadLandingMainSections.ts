import type { ComponentType } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { Dictionary } from "@/types/i18n";
import type {
  LandingBlock,
  LandingSectionSlug,
  SiteThemeKind,
} from "@/types/theming";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

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
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

type LandingMainSectionComponent = ComponentType<LandingMainSectionHostProps>;

/**
 * Dynamic import so unused *FontRoot / next/font modules stay out of the
 * home graph. Only the active `templateKind` is preloaded.
 */
export async function loadLandingMainSections(
  kind: SiteThemeKind,
): Promise<LandingMainSectionComponent> {
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
