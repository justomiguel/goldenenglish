import type { LandingSectionSlug } from "@/types/theming";

const m = (path: string) => `matiss.${path}`;
const indexed = (base: string, count: number, fields: readonly string[]) =>
  Array.from({ length: count }, (_, index) => fields.map((field) => m(`${base}.${index}.${field}`))).flat();

/**
 * Editable copy for the `matiss` landing. Dict paths live under
 * `dict.landing.matiss.*`. Section slugs are reused:
 * historia = manifesto and benefits, oferta = a class and the first class,
 * niveles = groups and age finder, modalidades = locations, gala, and contact,
 * certificaciones = gallery, FAQ, and the closing call.
 */
export const MATISS_LANDING_COPY_KEYS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, ReadonlyArray<string>>
> = {
  inicio: [
    m("hero.kicker"),
    m("hero.title"),
    m("hero.subtitle"),
    m("hero.ctaPrimary"),
    m("hero.ctaSecondary"),
    m("hero.facts.0"),
    m("hero.facts.1"),
    m("hero.facts.2"),
    m("hero.photoAlt"),
    m("register.shellTitle"),
    m("register.shellLead"),
  ],
  historia: [
    m("manifiesto.title"),
    m("manifiesto.body"),
    m("manifiesto.alt"),
    m("sobreNosotros.title"),
    m("sobreNosotros.bodyP1"),
    m("sobreNosotros.bodyP2"),
    ...indexed("sobreNosotros.items", 4, ["title", "body"]),
    m("sobreNosotros.photoAlt"),
  ],
  oferta: [
    m("clases.sectionTitle"),
    m("clases.lead"),
    ...indexed("clases.steps", 4, ["title", "body"]),
    m("primeraClase.title"),
    ...indexed("primeraClase.steps", 3, ["title", "body"]),
    m("primeraClase.button"),
  ],
  modalidades: [
    m("sedes.sectionTitle"),
    m("sedes.lead"),
    m("sedes.sanMiguel.name"),
    m("sedes.sanMiguel.body"),
    m("sedes.laFlorida.name"),
    m("sedes.laFlorida.body"),
    m("gala.title"),
    m("gala.body"),
    m("gala.alt"),
  ],
  niveles: [
    m("programas.sectionTitle"),
    m("programas.lead"),
    ...["babys-san-miguel", "senior-san-miguel", "babys-la-florida"].flatMap((id) =>
      ["name", "body", "alt"].map((field) => m(`programas.groups.${id}.${field}`)),
    ),
    m("edad.sectionTitle"),
    m("edad.lead"),
    m("edad.photoAltSmall"),
    m("edad.photoAltBig"),
  ],
  certificaciones: [
    m("galeria.sectionTitle"),
    m("galeria.alt"),
    m("faq.title"),
    ...indexed("faq.items", 6, ["q", "a"]),
    m("cta.title"),
    m("cta.subtitle"),
    m("cta.button"),
    m("cta.photoAlt"),
  ],
};

export const MATISS_MEDIA_SLOTS_BY_SECTION: Readonly<Record<LandingSectionSlug, number>> = {
  inicio: 2,
  historia: 2,
  oferta: 4,
  modalidades: 2,
  niveles: 3,
  certificaciones: 8,
};
