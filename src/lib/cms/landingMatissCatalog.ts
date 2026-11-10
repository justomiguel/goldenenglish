import type { LandingSectionSlug } from "@/types/theming";

/**
 * Editable copy for the `matiss` landing. Dict paths live under
 * `dict.landing.matiss.*`. Section slugs are reused:
 * historia = the studio, oferta = a class, niveles = schedule and age finder,
 * modalidades = the two locations, certificaciones = gallery and contact.
 */
export const MATISS_LANDING_COPY_KEYS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, ReadonlyArray<string>>
> = {
  inicio: [
    "matiss.hero.kicker",
    "matiss.hero.title",
    "matiss.hero.subtitle",
    "matiss.hero.ctaPrimary",
    "matiss.hero.ctaSecondary",
    "matiss.register.shellTitle",
    "matiss.register.shellLead",
  ],
  historia: [
    "matiss.manifiesto.title",
    "matiss.manifiesto.body",
    "matiss.manifiesto.alt",
    "matiss.sobreNosotros.title",
    "matiss.sobreNosotros.bodyP1",
    "matiss.sobreNosotros.bodyP2",
  ],
  oferta: [
    "matiss.clases.sectionTitle",
    "matiss.clases.lead",
    "matiss.clases.steps.0.title",
    "matiss.clases.steps.0.body",
    "matiss.clases.steps.1.title",
    "matiss.clases.steps.1.body",
    "matiss.clases.steps.2.title",
    "matiss.clases.steps.2.body",
    "matiss.clases.steps.3.title",
    "matiss.clases.steps.3.body",
  ],
  modalidades: [
    "matiss.sedes.sectionTitle",
    "matiss.sedes.lead",
    "matiss.sedes.sanMiguel.name",
    "matiss.sedes.sanMiguel.body",
    "matiss.sedes.laFlorida.name",
    "matiss.sedes.laFlorida.body",
  ],
  niveles: [
    "matiss.edad.sectionTitle",
    "matiss.edad.lead",
    "matiss.edad.photoAltSmall",
    "matiss.edad.photoAltBig",
    "matiss.horarios.sectionTitle",
  ],
  certificaciones: [
    "matiss.galeria.sectionTitle",
    "matiss.cta.title",
    "matiss.cta.subtitle",
    "matiss.cta.button",
  ],
};

export const MATISS_MEDIA_SLOTS_BY_SECTION: Readonly<Record<LandingSectionSlug, number>> = {
  inicio: 2,
  historia: 1,
  oferta: 4,
  modalidades: 1,
  niveles: 2,
  certificaciones: 3,
};
