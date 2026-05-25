import type { LandingSectionSlug } from "@/types/theming";

/**
 * Editable copy + media slots for the `mimundo` (Jardín Maternal Mi Mundo) landing shell.
 * Dict paths live under `dict.landing.mm.*` (see dictionaries).
 *
 * Sections:
 * - inicio:         Hero con mariposas flotantes, header, CTA "Reservar mi cupo"
 * - historia:       Propuesta pedagógica e historia del jardín
 * - oferta:         5 pilares educativos
 * - modalidades:    6 salas (Burbujas, Hormiguitas, Mariposas, Sol, Luna, Estrellas)
 * - niveles:        Día típico / jornada
 * - certificaciones: Equipo + CTA final + footer
 */
export const MIMUNDO_LANDING_COPY_KEYS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, ReadonlyArray<string>>
> = {
  inicio: [
    "mm.chrome.openMenu",
    "mm.chrome.closeMenu",
    "mm.chrome.facebookAria",
    "mm.chrome.instagramAria",
    "mm.nav.inicio",
    "mm.nav.propuesta",
    "mm.nav.salas",
    "mm.nav.galeria",
    "mm.nav.contacto",
    "mm.hero.kicker",
    "mm.hero.title",
    "mm.hero.subtitle",
    "mm.hero.ctaReservar",
    "mm.hero.ctaLogin",
  ],
  historia: [
    "mm.propuesta.sectionLabel",
    "mm.propuesta.title",
    "mm.propuesta.bodyP1",
    "mm.propuesta.bodyP2",
    "mm.propuesta.pilar1",
    "mm.propuesta.pilar2",
    "mm.propuesta.pilar3",
    "mm.propuesta.pilar4",
    "mm.propuesta.pilar5",
  ],
  oferta: [
    "mm.pilares.sectionTitle",
    "mm.pilares.arte.title",
    "mm.pilares.arte.body",
    "mm.pilares.naturaleza.title",
    "mm.pilares.naturaleza.body",
    "mm.pilares.musica.title",
    "mm.pilares.musica.body",
    "mm.pilares.juego.title",
    "mm.pilares.juego.body",
    "mm.pilares.lectura.title",
    "mm.pilares.lectura.body",
  ],
  modalidades: [
    "mm.salas.sectionTitle",
    "mm.salas.bebes.nombre",
    "mm.salas.bebes.edades",
    "mm.salas.bebes.descripcion",
    "mm.salas.sala1.nombre",
    "mm.salas.sala1.edades",
    "mm.salas.sala1.descripcion",
    "mm.salas.sala2.nombre",
    "mm.salas.sala2.edades",
    "mm.salas.sala2.descripcion",
    "mm.salas.sala3.nombre",
    "mm.salas.sala3.edades",
    "mm.salas.sala3.descripcion",
    "mm.salas.sala4.nombre",
    "mm.salas.sala4.edades",
    "mm.salas.sala4.descripcion",
    "mm.salas.sala5.nombre",
    "mm.salas.sala5.edades",
    "mm.salas.sala5.descripcion",
  ],
  niveles: [
    "mm.jornada.sectionTitle",
    "mm.jornada.intro",
    "mm.jornada.paso1.hora",
    "mm.jornada.paso1.titulo",
    "mm.jornada.paso2.hora",
    "mm.jornada.paso2.titulo",
    "mm.jornada.paso3.hora",
    "mm.jornada.paso3.titulo",
    "mm.jornada.paso4.hora",
    "mm.jornada.paso4.titulo",
    "mm.jornada.paso5.hora",
    "mm.jornada.paso5.titulo",
  ],
  certificaciones: [
    "mm.galeria.sectionTitle",
    "mm.equipo.sectionTitle",
    "mm.equipo.body",
    "mm.cta.title",
    "mm.cta.subtitle",
    "mm.cta.button",
    "mm.contact.title",
    "mm.contact.direccion",
    "mm.contact.telefono",
    "mm.contact.email",
    "mm.contact.mapaAria",
    "mm.footer.rightsLine",
    "mm.footer.siguenos",
    "mm.footerCta",
  ],
};

export const MIMUNDO_MEDIA_SLOTS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, number>
> = {
  inicio: 2,
  historia: 1,
  oferta: 5,
  modalidades: 6,
  niveles: 1,
  certificaciones: 9,
};

export const MIMUNDO_EDITABLE_COPY_KEYS: ReadonlyArray<string> = Object.values(
  MIMUNDO_LANDING_COPY_KEYS_BY_SECTION,
).flat();
