import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { LandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import type { LandingBlock, LandingSectionSlug } from "@/types/theming";
import { LandingHero } from "@/components/organisms/LandingHero";
import { LandingStory } from "@/components/organisms/LandingStory";
import { LandingModalities } from "@/components/organisms/LandingModalities";
import { LandingLevels } from "@/components/organisms/LandingLevels";
import { LandingCertifications } from "@/components/organisms/LandingCertifications";
import { LandingBlocksRenderer } from "@/components/organisms/LandingBlocksRenderer";

/** Order: hero → story → modalities (publics + cards) → levels → certifications. */
interface LandingMainSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  sessionEmail: string | null;
  inscriptionsOpen: boolean;
  mediaMap?: LandingMediaMap;
  blocksBySection?: Readonly<
    Record<LandingSectionSlug, ReadonlyArray<LandingBlock>>
  >;
}

function blocksFor(
  blocksBySection: LandingMainSectionsProps["blocksBySection"],
  section: LandingSectionSlug,
): ReadonlyArray<LandingBlock> {
  return blocksBySection?.[section] ?? [];
}

export function LandingMainSections({
  dict,
  brand,
  locale,
  sessionEmail,
  inscriptionsOpen,
  mediaMap,
  blocksBySection,
}: LandingMainSectionsProps) {
  return (
    <main>
      <LandingHero
        dict={dict}
        brand={brand}
        locale={locale}
        sessionEmail={sessionEmail}
        inscriptionsOpen={inscriptionsOpen}
        mediaMap={mediaMap}
      />
      <LandingBlocksRenderer
        section="inicio"
        blocks={blocksFor(blocksBySection, "inicio")}
        locale={locale}
      />
      <LandingStory dict={dict} brand={brand} mediaMap={mediaMap} />
      <LandingBlocksRenderer
        section="historia"
        blocks={blocksFor(blocksBySection, "historia")}
        locale={locale}
      />
      <LandingModalities dict={dict} mediaMap={mediaMap} />
      <LandingBlocksRenderer
        section="modalidades"
        blocks={blocksFor(blocksBySection, "modalidades")}
        locale={locale}
      />
      <LandingBlocksRenderer
        section="oferta"
        blocks={blocksFor(blocksBySection, "oferta")}
        locale={locale}
      />
      <LandingLevels dict={dict} />
      <LandingBlocksRenderer
        section="niveles"
        blocks={blocksFor(blocksBySection, "niveles")}
        locale={locale}
      />
      <LandingCertifications dict={dict} />
      <LandingBlocksRenderer
        section="certificaciones"
        blocks={blocksFor(blocksBySection, "certificaciones")}
        locale={locale}
      />
    </main>
  );
}
