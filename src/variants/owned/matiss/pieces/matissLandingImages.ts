import type { LandingSectionSlug } from "@/types/theming";

const BASE = "/images/matiss";
const foto = (name: string) => `${BASE}/fotos/${name}.jpg`;
const galeria = (n: number) => `${BASE}/galeria/${n}.jpg`;

/**
 * Bundled fallback for one CMS media slot. Positions follow the catalog.
 * Visible slots use client photos only. `inicio/1` is the share image, which
 * stays an illustration so a child's face is not in every link preview.
 */
const SLOT_PATH: Record<LandingSectionSlug, ReadonlyArray<string>> = {
  inicio: [`${BASE}/ilustraciones/og.jpg`, foto("roja")],
  historia: [foto("acompanar"), foto("pequena")],
  oferta: [foto("clase-brazos"), foto("clase-grupo"), foto("clase-profe"), galeria(2)],
  modalidades: [galeria(3), galeria(1)],
  niveles: [foto("sentada"), foto("grande"), foto("lila")],
  certificaciones: [
    galeria(1),
    foto("roja"),
    foto("clase-brazos"),
    foto("grande"),
    galeria(2),
    foto("sentada"),
    foto("clase-profe"),
    foto("lila"),
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
