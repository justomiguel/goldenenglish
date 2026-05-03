import type { LandingSectionSlug } from "@/types/theming";

/**
 * Editable copy + media slots for the `espaciozenit` landing shell.
 * Dict paths live under `dict.landing.ez.*` (see dictionaries).
 */
export const ESPACIO_ZENIT_LANDING_COPY_KEYS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, ReadonlyArray<string>>
> = {
  inicio: [
    "ez.chrome.openMenu",
    "ez.chrome.closeMenu",
    "ez.header.subtitle",
    "ez.nav.nosotros",
    "ez.nav.disciplinas",
    "ez.nav.horarios",
    "ez.nav.galeria",
    "ez.nav.contacto",
    "ez.nav.enroll",
    "ez.hero.brushLine1",
    "ez.hero.brushLine2",
    "ez.hero.tagline",
    "ez.hero.introBody",
    "ez.hero.ctaSecondary",
    "ez.placeholders.heroFigure",
    "ez.placeholders.disciplinePhoto",
    "ez.placeholders.groupPhoto",
    "ez.placeholders.schedule",
    "ez.placeholders.gallery",
  ],
  historia: [
    "ez.quienes.title",
    "ez.origenes.title",
    "ez.origenes.body",
    "ez.llegada.title",
    "ez.llegada.body",
    "ez.tab.felipe",
    "ez.tab.jane",
    "ez.bio.felipe.p1",
    "ez.bio.felipe.p2",
    "ez.bio.felipe.p3",
    "ez.bio.felipe.p4",
    "ez.bio.felipe.p5",
    "ez.bio.felipe.p6",
    "ez.bio.jane.p1",
    "ez.bio.jane.p2",
    "ez.bio.jane.p3",
  ],
  modalidades: [
    "ez.horarios.title",
    "ez.horarios.body",
    "ez.galeria.title",
    "ez.galeria.body",
    "ez.sedes.sectionTitle",
    "ez.sedes.sectionSubtitle",
    "ez.sede.title",
    "ez.sede.subtitle",
    "ez.map.embedSrc",
    "ez.map.iframeTitle",
  ],
  niveles: [
    "ez.disciplinas.sectionTitle",
    "ez.disciplinas.lead",
    "ez.disciplinas.verMas",
    "ez.disciplinas.ballet.tag",
    "ez.disciplinas.ballet.title",
    "ez.disciplinas.ballet.body",
    "ez.disciplinas.hiphop.tag",
    "ez.disciplinas.hiphop.title",
    "ez.disciplinas.hiphop.body",
  ],
  certificaciones: [
    "ez.pillars.sectionTitle",
    "ez.pillars.professors",
    "ez.pillars.safe",
    "ez.pillars.formation",
    "ez.pillars.shows",
    "ez.enrollment.title",
    "ez.enrollment.cta",
    "ez.footer.followTitle",
    "ez.footer.socialHandle",
    "ez.footer.contactTitle",
    "ez.footer.rightsLine",
    "ez.contact.title",
    "ez.contact.subtitle",
    "ez.contact.phoneDisplay",
    "ez.contact.instagramTitle",
    "ez.contact.instagramCta",
    "ez.contact.instagramUrl",
    "ez.contact.facebookUrl",
    "ez.contact.facebookAria",
    "ez.contact.emailPlaceholder",
    "ez.contact.formHint",
  ],
  oferta: [
    "ez.cursos.title",
    "ez.cursos.subtitle",
    "ez.cursos.ageLine",
    "ez.cursos.bodyP1",
    "ez.cursos.bodyP2",
    "ez.cursos.onlineCta",
    "ez.footerCta",
  ],
};

export const ESPACIO_ZENIT_MEDIA_SLOTS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, number>
> = {
  inicio: 2,
  historia: 3,
  modalidades: 0,
  niveles: 0,
  certificaciones: 0,
  oferta: 2,
};

export const ESPACIO_ZENIT_EDITABLE_COPY_KEYS: ReadonlyArray<string> =
  Object.values(ESPACIO_ZENIT_LANDING_COPY_KEYS_BY_SECTION).flat();
