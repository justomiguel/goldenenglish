import type { LandingSectionSlug } from "@/types/theming";

/**
 * Editable copy + media slots for the `mimundo` (Jardín Materno Infantil Mi Mundo) landing shell.
 * Dict paths live under `dict.landing.mm.*` (see dictionaries).
 *
 * Sections:
 * - inicio:         Hero, header, nav (Institucional, Colonia…)
 * - historia:       ¿Quiénes somos? + propuesta pedagógica
 * - oferta:         5 pilares educativos
 * - modalidades:    9 salas (edades + Atelier, Música, Inglés)
 * - niveles:        Colonia de vacaciones + día típico / jornada
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
    "mm.nav.institucional",
    "mm.nav.colonia",
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
    "mm.institucional.sectionLabel",
    "mm.institucional.title",
    "mm.institucional.bodyP1",
    "mm.institucional.bodyP2",
    "mm.institucional.highlight1",
    "mm.institucional.highlight2",
    "mm.institucional.highlight3",
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
    "mm.salas.sala6.nombre",
    "mm.salas.sala6.edades",
    "mm.salas.sala6.descripcion",
    "mm.salas.sala7.nombre",
    "mm.salas.sala7.edades",
    "mm.salas.sala7.descripcion",
    "mm.salas.sala8.nombre",
    "mm.salas.sala8.edades",
    "mm.salas.sala8.descripcion",
  ],
  niveles: [
    "mm.colonia.sectionLabel",
    "mm.colonia.title",
    "mm.colonia.bodyP1",
    "mm.colonia.bodyP2",
    "mm.colonia.bullet1",
    "mm.colonia.bullet2",
    "mm.colonia.note",
    "mm.colonia.cta",
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
  historia: 2,
  oferta: 5,
  modalidades: 9,
  niveles: 2,
  certificaciones: 9,
};

export const MIMUNDO_EDITABLE_COPY_KEYS: ReadonlyArray<string> = Object.values(
  MIMUNDO_LANDING_COPY_KEYS_BY_SECTION,
).flat();
