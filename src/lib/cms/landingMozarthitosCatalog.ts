import type { LandingSectionSlug } from "@/types/theming";

/**
 * Editable copy + media slots for the `mozarthitos` landing shell.
 * Dict paths live under `dict.landing.mz.*` (see dictionaries).
 */
export const MOZARTHITOS_LANDING_COPY_KEYS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, ReadonlyArray<string>>
> = {
  inicio: [
    "mz.chrome.openMenu",
    "mz.chrome.closeMenu",
    "mz.nav.inicio",
    "mz.nav.quienes",
    "mz.nav.cursos",
    "mz.nav.sedes",
    "mz.nav.contacto",
    "mz.hero.title",
    "mz.hero.subtitle",
  ],
  historia: [
    "mz.quienes.title",
    "mz.origenes.title",
    "mz.origenes.body",
    "mz.llegada.title",
    "mz.llegada.body",
    "mz.tab.felipe",
    "mz.tab.jane",
    "mz.bio.felipe.p1",
    "mz.bio.felipe.p2",
    "mz.bio.felipe.p3",
    "mz.bio.felipe.p4",
    "mz.bio.felipe.p5",
    "mz.bio.felipe.p6",
    "mz.bio.jane.p1",
    "mz.bio.jane.p2",
    "mz.bio.jane.p3",
  ],
  modalidades: [
    "mz.sedes.sectionTitle",
    "mz.sedes.sectionSubtitle",
    "mz.sede.title",
    "mz.sede.subtitle",
    "mz.map.embedSrc",
    "mz.map.iframeTitle",
  ],
  niveles: [],
  certificaciones: [
    "mz.contact.title",
    "mz.contact.subtitle",
    "mz.contact.phoneDisplay",
    "mz.contact.instagramTitle",
    "mz.contact.instagramCta",
    "mz.contact.instagramUrl",
    "mz.contact.formHint",
  ],
  oferta: [
    "mz.cursos.title",
    "mz.cursos.subtitle",
    "mz.cursos.ageLine",
    "mz.cursos.bodyP1",
    "mz.cursos.bodyP2",
    "mz.cursos.onlineCta",
    "mz.footerCta",
  ],
};

export const MOZARTHITOS_MEDIA_SLOTS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, number>
> = {
  inicio: 2,
  historia: 3,
  modalidades: 0,
  niveles: 0,
  certificaciones: 0,
  oferta: 2,
};

export const MOZARTHITOS_EDITABLE_COPY_KEYS: ReadonlyArray<string> =
  Object.values(MOZARTHITOS_LANDING_COPY_KEYS_BY_SECTION).flat();
