import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { genericSectionStockPath } from "@/lib/theme/genericInstituteTemplates";
import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import {
  genericLandingComposition,
  type GenericLandingSection,
} from "@/lib/landing/genericLandingComposition";
import { GenericLandingHero } from "@/components/organisms/generic-landing/GenericLandingHero";
import { GenericLandingDay } from "@/components/organisms/generic-landing/GenericLandingDay";
import { GenericLandingBands } from "@/components/organisms/generic-landing/GenericLandingBands";
import { GenericLandingClose } from "@/components/organisms/generic-landing/GenericLandingClose";
import type {
  GenericLandingContactLabels,
  GenericLandingContactValue,
} from "@/components/organisms/GenericLandingContact";

export type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";

export interface LandingMainSectionsGenericProps {
  copy: GenericLandingCopy;
  locale: string;
  kind: GenericInstituteKind;
  /** CMS upload for Inicio. Stock art is the fallback. */
  heroSrc?: string;
  sectionSrc?: Partial<Record<GenericLandingSection, string>>;
  sectionLabels?: Partial<Record<GenericLandingSection, string>>;
  hiddenSections?: ReadonlySet<string>;
  contact?: GenericLandingContactValue;
  contactLabels?: GenericLandingContactLabels;
}

export function LandingMainSectionsGeneric({
  copy,
  locale,
  kind,
  heroSrc,
  sectionSrc,
  sectionLabels,
  hiddenSections,
  contact,
  contactLabels,
}: LandingMainSectionsGenericProps) {
  const composition = genericLandingComposition(kind);
  return (
    <article className="overflow-x-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      <GenericLandingHero
        layout={composition.hero}
        copy={copy}
        heroSrc={heroSrc ?? genericSectionStockPath(kind, "inicio")}
      />
      <GenericLandingDay layout={composition.day} copy={copy} />
      <GenericLandingBands
        layout={composition.bands}
        kind={kind}
        copy={copy}
        sectionSrc={sectionSrc}
        sectionLabels={sectionLabels}
        hiddenSections={hiddenSections}
      />
      <GenericLandingClose
        layout={composition.close}
        copy={copy}
        locale={locale}
        contact={contact}
        contactLabels={contactLabels}
      />
    </article>
  );
}
