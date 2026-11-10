import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MATISS_GROUPS } from "@/lib/landing/matissSchedule";
import { landingRegisterCtasFromDict } from "@/lib/settings/landingRegisterCtasFromDict";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";
import type { MatissGalleryLabels } from "@/lib/landing/matissGalleryCarousel";

export interface LandingMatissImages {
  heroWeb: string;
  manifesto: string;
  benefits: string;
  programs: readonly string[];
  classes: readonly string[];
  gala: string;
  gallery: readonly string[];
  contact: string;
}

export interface LandingMatissSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  links: { href: string; label: string }[];
  images: LandingMatissImages;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

function rows<K extends string>(t: (path: string) => string, base: string, count: number, fields: readonly K[]) {
  return Array.from({ length: count }, (_, index) =>
    Object.fromEntries(fields.map((field) => [field, t(`${base}.${index}.${field}`)])) as Record<K, string>,
  ).filter((row) => Object.values(row).some(Boolean));
}

export function buildMatissLanding({
  dict,
  brand,
  locale,
  links,
  images,
  publicCtaMode,
  inscriptionsEnabled,
}: LandingMatissSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  const primary = landingRegisterCtasFromDict({ locale, dict, publicCtaMode, inscriptionsEnabled })[0];
  const locationNames = { sanMiguel: t("sedes.sanMiguel.name"), laFlorida: t("sedes.laFlorida.name") };
  const programs = Object.fromEntries(
    MATISS_GROUPS.map((group) => [
      group.id,
      {
        name: t(`programas.groups.${group.id}.name`),
        body: t(`programas.groups.${group.id}.body`),
        alt: t(`programas.groups.${group.id}.alt`),
      },
    ]),
  );
  const dayLabels = { saturday: t("horarios.days.saturday"), sunday: t("horarios.days.sunday") };
  const yearsLabel = t("edad.years");
  const seal = { sealRing: t("seal.ring"), logoSrc: brand.logoPath };
  const labels: MatissGalleryLabels = {
    close: t("galeria.close"),
    prev: t("galeria.prev"),
    next: t("galeria.next"),
    position: t("galeria.position"),
  };

  return {
    hero: {
      kicker: t("hero.kicker"),
      title: t("hero.title"),
      subtitle: t("hero.subtitle"),
      facts: [0, 1, 2].map((n) => t(`hero.facts.${n}`)).filter(Boolean),
      primaryHref: primary?.href,
      primaryLabel: t("hero.ctaPrimary"),
      secondaryHref: `/${locale}#clases`,
      secondaryLabel: t("hero.ctaSecondary"),
      photoSrc: images.heroWeb,
      photoAlt: t("hero.photoAlt"),
      ...seal,
      logoAlt: brand.logoAlt || brand.name,
    },
    manifesto: {
      title: t("manifiesto.title"),
      body: t("manifiesto.body"),
      alt: t("manifiesto.alt"),
      src: images.manifesto,
    },
    benefits: {
      kicker: t("sobreNosotros.kicker"),
      title: t("sobreNosotros.title"),
      lead: t("sobreNosotros.bodyP1"),
      director: t("sobreNosotros.bodyP2"),
      items: rows(t, "sobreNosotros.items", 4, ["title", "body"] as const),
      photoSrc: images.benefits,
      photoAlt: t("sobreNosotros.photoAlt"),
      ...seal,
    },
    programs: {
      title: t("programas.sectionTitle"),
      lead: t("programas.lead"),
      dayLabels,
      yearsLabel,
      locationNames,
      programs,
      photos: images.programs,
    },
    age: {
      title: t("edad.sectionTitle"),
      lead: t("edad.lead"),
      yearsLabel,
      emptyLabel: t("edad.empty"),
      dayLabels,
      photoSmall: images.programs[0] ?? images.heroWeb,
      photoBig: images.programs[1] ?? images.heroWeb,
      photoAltSmall: t("edad.photoAltSmall"),
      photoAltBig: t("edad.photoAltBig"),
      locationNames,
      groupNames: Object.fromEntries(Object.entries(programs).map(([id, copy]) => [id, copy.name])),
    },
    classDay: {
      title: t("clases.sectionTitle"),
      lead: t("clases.lead"),
      steps: rows(t, "clases.steps", 4, ["title", "body"] as const),
      photos: images.classes,
    },
    firstClass: {
      title: t("primeraClase.title"),
      steps: rows(t, "primeraClase.steps", 3, ["title", "body"] as const),
      buttonHref: primary?.href,
      buttonLabel: t("primeraClase.button"),
    },
    gala: {
      title: t("gala.title"),
      body: t("gala.body"),
      photoSrc: images.gala,
      photoAlt: t("gala.alt"),
      ...seal,
    },
    gallery: {
      title: t("galeria.sectionTitle"),
      alt: t("galeria.alt"),
      photos: images.gallery,
      labels,
    },
    locations: {
      title: t("sedes.sectionTitle"),
      lead: t("sedes.lead"),
      mapsLabel: t("sedes.maps"),
      locations: (["sanMiguel", "laFlorida"] as const).map((key) => ({
        key,
        name: t(`sedes.${key}.name`),
        body: t(`sedes.${key}.body`),
        address: t(`sedes.${key}.address`),
      })),
    },
    faq: { title: t("faq.title"), items: rows(t, "faq.items", 6, ["q", "a"] as const) },
    contact: {
      locale,
      dict,
      title: t("cta.title"),
      subtitle: t("cta.subtitle"),
      photoSrc: images.contact,
      photoAlt: t("cta.photoAlt"),
      whatsappHref: brand.socialWhatsapp,
      primaryHref: primary?.href,
      primaryLabel: t("cta.button"),
      ...seal,
    },
    footer: { dict, brand, locale, links },
  };
}
