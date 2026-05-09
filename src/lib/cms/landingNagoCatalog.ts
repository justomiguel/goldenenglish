import type { LandingSectionSlug } from "@/types/theming";

/**
 * Editable copy + media slots for the `nago` (Capoeira Nago) landing shell.
 * Dict paths live under `dict.landing.nago.*` (see dictionaries).
 *
 * Sections based on the Capoeira Nago landing design:
 * - Inicio: hero with capoeirista silhouette, navigation
 * - Historia (Sobre Nosotros): about section with circular image
 * - Oferta (Nuestros Principios): respeto, disciplina, unión, cultura
 * - Modalidades (Galería): gallery grid
 * - Certificaciones (CTA): "Ven y sé parte de nuestra roda"
 * - Niveles: reserved for future use
 */
export const NAGO_LANDING_COPY_KEYS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, ReadonlyArray<string>>
> = {
  inicio: [
    "nago.chrome.openMenu",
    "nago.chrome.closeMenu",
    "nago.chrome.facebookAria",
    "nago.chrome.instagramAria",
    "nago.nav.inicio",
    "nago.nav.sobreNosotros",
    "nago.nav.clases",
    "nago.nav.galeria",
    "nago.nav.eventos",
    "nago.nav.contacto",
    "nago.hero.title",
    "nago.hero.subtitle",
    "nago.hero.tagline",
  ],
  historia: [
    "nago.sobreNosotros.title",
    "nago.sobreNosotros.bodyP1",
    "nago.sobreNosotros.bodyP2",
  ],
  oferta: [
    "nago.principios.sectionTitle",
    "nago.principios.respeto.title",
    "nago.principios.respeto.body",
    "nago.principios.disciplina.title",
    "nago.principios.disciplina.body",
    "nago.principios.union.title",
    "nago.principios.union.body",
    "nago.principios.cultura.title",
    "nago.principios.cultura.body",
  ],
  modalidades: [
    "nago.galeria.sectionTitle",
    "nago.galeria.verMas",
  ],
  niveles: [],
  certificaciones: [
    "nago.cta.title",
    "nago.cta.subtitle",
    "nago.cta.button",
    "nago.footer.enlacesTitle",
    "nago.footer.siguenos",
    "nago.footer.rightsLine",
    "nago.contact.title",
    "nago.contact.phoneDisplay",
    "nago.contact.instagramUrl",
    "nago.contact.facebookUrl",
    "nago.contact.whatsappUrl",
    "nago.contact.youtubeUrl",
  ],
};

export const NAGO_MEDIA_SLOTS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, number>
> = {
  inicio: 2,
  historia: 1,
  modalidades: 3,
  niveles: 0,
  certificaciones: 0,
  oferta: 4,
};

export const NAGO_EDITABLE_COPY_KEYS: ReadonlyArray<string> = Object.values(
  NAGO_LANDING_COPY_KEYS_BY_SECTION,
).flat();
