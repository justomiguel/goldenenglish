import { templateNavItems, type TemplateSectionId } from "@/lib/landing/templateSections";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import { GENERIC_LANDING_SECTIONS, type GenericLandingSection } from "@/lib/landing/genericLandingComposition";
import { SectionListRenderer } from "@/components/organisms/SectionListRenderer";
import { genericLandingSections } from "@/lib/design-variants/genericLandingSections";
import { GenericLandingFooter } from "@/components/organisms/generic-landing/GenericLandingFooter";
import { TemplateThumbCta } from "@/components/organisms/generic-landing/TemplateThumbCta";
import { GenericLandingNav } from "@/components/organisms/generic-landing/GenericLandingNav";
import styles from "@/components/organisms/generic-landing/genericLanding.module.css";
import type {
  GenericLandingContactLabels,
  GenericLandingContactValue,
} from "@/components/organisms/GenericLandingContact";
import type { Locale } from "@/types/i18n";

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

function asLocale(value: string): Locale {
  if (value === "en" || value === "pt") return value;
  return "es";
}

export async function LandingMainSectionsGeneric({
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
  const name = siteName?.trim() || copy.name;
  const visible = GENERIC_LANDING_SECTIONS.filter((section) => !hiddenSections?.has(section));
  const items = templateNavItems(menu, ["inicio", ...visible, "contacto"]).map(([id, label]) => ({
    id,
    label,
  }));
  const sections = genericLandingSections({
    kind,
    copy,
    locale,
    heroSrc,
    sectionSrc,
    sectionLabels,
    hiddenSections,
    contact,
    contactLabels,
  });
  const body = await SectionListRenderer({ sections, tenantSlug: null, locale: asLocale(locale) });
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
      {body}
      <GenericLandingFooter siteName={name} contact={contact} />
      <TemplateThumbCta label={copy.cta} />
    </article>
  );
}
