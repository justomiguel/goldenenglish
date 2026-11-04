import { templateNavItems, type TemplateSectionId } from "@/lib/landing/templateSections";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { genericSectionStockPath } from "@/lib/theme/genericInstituteTemplates";
import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import {
  GENERIC_LANDING_SECTIONS,
  genericLandingComposition,
  type GenericLandingSection,
} from "@/lib/landing/genericLandingComposition";
import { GenericLandingHero } from "@/components/organisms/generic-landing/GenericLandingHero";
import { GenericLandingDay } from "@/components/organisms/generic-landing/GenericLandingDay";
import { GenericLandingBands } from "@/components/organisms/generic-landing/GenericLandingBands";
import { GenericLandingClose } from "@/components/organisms/generic-landing/GenericLandingClose";
import { GenericLandingFooter } from "@/components/organisms/generic-landing/GenericLandingFooter";
import { TemplateThumbCta } from "@/components/organisms/generic-landing/TemplateThumbCta";
import { GenericLandingNav } from "@/components/organisms/generic-landing/GenericLandingNav";
import styles from "@/components/organisms/generic-landing/genericLanding.module.css";
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
  siteName?: string;
  logoSrc?: string | null;
  logoAlt?: string;
  nav: {
    inicio: string;
    contacto: string;
    openMenu: string;
    closeMenu: string;
  };
  menu: Record<TemplateSectionId, string>;
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
  siteName,
  logoSrc,
  logoAlt,
  menu,
}: LandingMainSectionsGenericProps) {
  const composition = genericLandingComposition(kind);
  const name = siteName?.trim() || copy.name;
  const visible = GENERIC_LANDING_SECTIONS.filter((section) => !hiddenSections?.has(section));
  const items = templateNavItems(menu, ["inicio", ...visible, "contacto"]).map(([id, label]) => ({
    id,
    label,
  }));
  return (
    <article className={`${styles.page} bg-[var(--color-background)] text-[var(--color-foreground)]`}>
      <GenericLandingNav
        kind={kind}
        siteName={name}
        logoSrc={logoSrc}
        logoAlt={logoAlt?.trim() || name}
        cta={copy.cta}
        items={items}
      />
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
      <GenericLandingFooter siteName={name} contact={contact} />
      <TemplateThumbCta label={copy.cta} />
    </article>
  );
}
