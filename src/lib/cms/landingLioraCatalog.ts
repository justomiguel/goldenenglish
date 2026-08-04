import type { LandingSectionSlug } from "@/types/theming";

/**
 * Editable copy + media slots for the `liora` (Liora Studio) landing shell.
 * Dict paths live under `dict.landing.liora.*` (see dictionaries).
 *
 * Canonical section slugs are reused with a ballet-studio meaning:
 * - Inicio: hero + nav chrome
 * - Historia (Sobre nosotros): studio story and pillars
 * - Oferta (Clases): pre ballet / infantil / juvenil / adulto
 * - Modalidades (Sedes): Providencia, Maipú, San Miguel
 * - Niveles (Horarios): weekly timetable per sede
 * - Certificaciones (CTA + footer + contacto)
 */
export const LIORA_LANDING_COPY_KEYS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, ReadonlyArray<string>>
> = {
  inicio: [
    "liora.chrome.openMenu",
    "liora.chrome.closeMenu",
    "liora.chrome.instagramAria",
    "liora.chrome.whatsappAria",
    "liora.nav.inicio",
    "liora.nav.sobreNosotros",
    "liora.nav.clases",
    "liora.nav.sedes",
    "liora.nav.horarios",
    "liora.nav.galeria",
    "liora.nav.eventos",
    "liora.nav.contacto",
    "liora.register.shellTitle",
    "liora.register.shellLead",
    "liora.hero.kicker",
    "liora.hero.title",
    "liora.hero.subtitle",
    "liora.hero.tagline",
    "liora.hero.ctaPrimary",
    "liora.hero.ctaSecondary",
  ],
  historia: [
    "liora.sobreNosotros.kicker",
    "liora.sobreNosotros.title",
    "liora.sobreNosotros.bodyP1",
    "liora.sobreNosotros.bodyP2",
    "liora.sobreNosotros.pilar1.title",
    "liora.sobreNosotros.pilar1.body",
    "liora.sobreNosotros.pilar2.title",
    "liora.sobreNosotros.pilar2.body",
    "liora.sobreNosotros.pilar3.title",
    "liora.sobreNosotros.pilar3.body",
  ],
  oferta: [
    "liora.clases.kicker",
    "liora.clases.sectionTitle",
    "liora.clases.lead",
    "liora.clases.ageLabel",
    "liora.clases.preBallet.title",
    "liora.clases.preBallet.ages",
    "liora.clases.preBallet.body",
    "liora.clases.infantil.title",
    "liora.clases.infantil.ages",
    "liora.clases.infantil.body",
    "liora.clases.juvenil.title",
    "liora.clases.juvenil.ages",
    "liora.clases.juvenil.body",
    "liora.clases.adulto.title",
    "liora.clases.adulto.ages",
    "liora.clases.adulto.body",
  ],
  modalidades: [
    "liora.sedes.kicker",
    "liora.sedes.sectionTitle",
    "liora.sedes.lead",
    "liora.sedes.providencia.name",
    "liora.sedes.providencia.metro",
    "liora.sedes.providencia.body",
    "liora.sedes.maipu.name",
    "liora.sedes.maipu.metro",
    "liora.sedes.maipu.body",
    "liora.sedes.sanMiguel.name",
    "liora.sedes.sanMiguel.metro",
    "liora.sedes.sanMiguel.body",
  ],
  niveles: [
    "liora.horarios.kicker",
    "liora.horarios.sectionTitle",
    "liora.horarios.lead",
    "liora.horarios.dayLabel",
    "liora.horarios.note",
  ],
  certificaciones: [
    "liora.galeria.kicker",
    "liora.galeria.sectionTitle",
    "liora.galeria.verMas",
    "liora.cta.title",
    "liora.cta.subtitle",
    "liora.cta.button",
    "liora.footer.enlacesTitle",
    "liora.footer.sedesTitle",
    "liora.footer.contactoTitle",
    "liora.footer.siguenos",
    "liora.footer.rightsLine",
    "liora.footerCta",
    "liora.contact.instagramUrl",
    "liora.contact.whatsappUrl",
  ],
};

export const LIORA_MEDIA_SLOTS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, number>
> = {
  inicio: 1,
  historia: 1,
  oferta: 4,
  modalidades: 3,
  niveles: 0,
  certificaciones: 0,
};

export const LIORA_EDITABLE_COPY_KEYS: ReadonlyArray<string> = Object.values(
  LIORA_LANDING_COPY_KEYS_BY_SECTION,
).flat();
