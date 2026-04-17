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

/**
 * Minimal template_kind variant.
 *
 * Same canonical sections as `LandingMainSections`, but every section is
 * wrapped in a generously spaced container with a thin centered separator,
 * giving the public landing an airy, editorial-light personality.
 *
 * Brand tokens and content stay shared with the other shells; only the
 * visual rhythm and section spacing change.
 */
interface LandingMainSectionsMinimalProps {
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
  blocksBySection: LandingMainSectionsMinimalProps["blocksBySection"],
  section: LandingSectionSlug,
): ReadonlyArray<LandingBlock> {
  return blocksBySection?.[section] ?? [];
}

function MinimalBlock({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">{children}</div>
    </section>
  );
}

function MinimalDivider() {
  return (
    <div
      aria-hidden
      className="mx-auto h-px w-16 bg-[var(--color-border)]"
    />
  );
}

export function LandingMainSectionsMinimal({
  dict,
  brand,
  locale,
  sessionEmail,
  inscriptionsOpen,
  mediaMap,
  blocksBySection,
}: LandingMainSectionsMinimalProps) {
  return (
    <main className="bg-[var(--color-background)]">
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

      <MinimalDivider />
      <MinimalBlock>
        <LandingStory dict={dict} brand={brand} mediaMap={mediaMap} />
        <LandingBlocksRenderer
          section="historia"
          blocks={blocksFor(blocksBySection, "historia")}
          locale={locale}
        />
      </MinimalBlock>

      <MinimalDivider />
      <MinimalBlock>
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
      </MinimalBlock>

      <MinimalDivider />
      <MinimalBlock>
        <LandingLevels dict={dict} />
        <LandingBlocksRenderer
          section="niveles"
          blocks={blocksFor(blocksBySection, "niveles")}
          locale={locale}
        />
      </MinimalBlock>

      <MinimalDivider />
      <MinimalBlock>
        <LandingCertifications dict={dict} />
        <LandingBlocksRenderer
          section="certificaciones"
          blocks={blocksFor(blocksBySection, "certificaciones")}
          locale={locale}
        />
      </MinimalBlock>
    </main>
  );
}
