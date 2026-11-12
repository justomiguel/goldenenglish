import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { VariantSurfaceEntry } from "@/components/organisms/VariantSurfaceEntry";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";
import { buildLioraHomeProps } from "@/variants/owned/liora/home/v1/hostProps";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

interface LandingMainSectionsLioraProps {
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

export function LandingMainSectionsLiora(props: LandingMainSectionsLioraProps) {
  return (
    <LioraFontRoot>
      <VariantSurfaceEntry variantKey="page.liora-home@1" props={buildLioraHomeProps(props)} />
    </LioraFontRoot>
  );
}
