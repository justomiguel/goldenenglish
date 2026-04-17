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
 * Editorial template_kind variant.
 *
 * Same canonical sections as `LandingMainSections`, but composed in a
 * full-bleed shell with display dividers and re-ordered chrome to give
 * the public landing a distinctly editorial personality.
 *
 * The visual switch is intentionally restrained (wrappers + ordering)
 * so that brand + content stay shared with the classic shell.
 */
interface LandingMainSectionsEditorialProps {
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
  blocksBySection: LandingMainSectionsEditorialProps["blocksBySection"],
  section: LandingSectionSlug,
): ReadonlyArray<LandingBlock> {
  return blocksBySection?.[section] ?? [];
}

function EditorialBand({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
    </section>
  );
}

export function LandingMainSectionsEditorial({
  dict,
  brand,
  locale,
  sessionEmail,
  inscriptionsOpen,
  mediaMap,
  blocksBySection,
}: LandingMainSectionsEditorialProps) {
  return (
    <main className="bg-[var(--color-surface)]">
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

      <EditorialBand>
        <LandingStory dict={dict} brand={brand} mediaMap={mediaMap} />
        <LandingBlocksRenderer
          section="historia"
          blocks={blocksFor(blocksBySection, "historia")}
          locale={locale}
        />
      </EditorialBand>

      <EditorialBand>
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
      </EditorialBand>

      <EditorialBand>
        <LandingCertifications dict={dict} />
        <LandingBlocksRenderer
          section="certificaciones"
          blocks={blocksFor(blocksBySection, "certificaciones")}
          locale={locale}
        />
      </EditorialBand>

      <EditorialBand>
        <LandingLevels dict={dict} />
        <LandingBlocksRenderer
          section="niveles"
          blocks={blocksFor(blocksBySection, "niveles")}
          locale={locale}
        />
      </EditorialBand>
    </main>
  );
}
