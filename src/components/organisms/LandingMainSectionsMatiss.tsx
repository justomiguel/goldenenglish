import type { BrandPublic } from "@/lib/brand/server";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";
import type { Dictionary } from "@/types/i18n";
import { VariantSurfaceEntry } from "@/components/organisms/VariantSurfaceEntry";
import { MatissFontRoot } from "@/variants/owned/matiss/font/v1/Web";
import { buildMatissHomeProps } from "@/variants/owned/matiss/home/v1/hostProps";

interface LandingMainSectionsMatissProps {
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

export function LandingMainSectionsMatiss(props: LandingMainSectionsMatissProps) {
  return (
    <MatissFontRoot>
      <VariantSurfaceEntry
        variantKey="page.matiss-home@1"
        props={buildMatissHomeProps({ ...props, sessionEmail: props.sessionEmail ?? null })}
      />
    </MatissFontRoot>
  );
}
