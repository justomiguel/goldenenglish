import type { LandingSectionSlug } from "@/types/theming";

const BASE = "/images/matiss";

/** Bundled fallback for one CMS media slot. Positions follow the catalog. */
const SLOT_PATH: Record<LandingSectionSlug, ReadonlyArray<string>> = {
  inicio: [`${BASE}/ilustraciones/og.jpg`, `${BASE}/personajes/pequena.jpg`],
  historia: [`${BASE}/personajes/grande.jpg`],
  oferta: [1, 2, 3, 4].map((n) => `${BASE}/ilustraciones/clase-${n}.jpg`),
  modalidades: [`${BASE}/personajes/grupo.jpg`],
  niveles: [`${BASE}/personajes/pequena.jpg`, `${BASE}/personajes/grande.jpg`],
  certificaciones: [
    `${BASE}/personajes/pequena.jpg`,
    `${BASE}/personajes/grande.jpg`,
    `${BASE}/personajes/grupo.jpg`,
  ],
};

export function matissSectionImageSrc(
  section: LandingSectionSlug,
  filename: string,
): string {
  const position = Number.parseInt(filename, 10);
  const slots = SLOT_PATH[section];
  return slots[position - 1] ?? slots[0] ?? `${BASE}/logo/logo.png`;
}
