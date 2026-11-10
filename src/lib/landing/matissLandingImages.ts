import type { LandingSectionSlug } from "@/types/theming";

const BASE = "/images/matiss";

/** Bundled fallback for one CMS media slot. Positions follow the catalog. */
const SLOT_PATH: Record<LandingSectionSlug, ReadonlyArray<string>> = {
  inicio: [`${BASE}/ilustraciones/og.jpg`],
  historia: [`${BASE}/galeria/3.jpg`],
  oferta: [1, 2, 3, 4].map((n) => `${BASE}/ilustraciones/clase-${n}.jpg`),
  modalidades: [],
  niveles: [],
  certificaciones: [1, 2, 3, 4].map((n) => `${BASE}/galeria/${n}.jpg`),
};

export function matissSectionImageSrc(
  section: LandingSectionSlug,
  filename: string,
): string {
  const position = Number.parseInt(filename, 10);
  const slots = SLOT_PATH[section];
  return slots[position - 1] ?? slots[0] ?? `${BASE}/logo/logo.png`;
}
