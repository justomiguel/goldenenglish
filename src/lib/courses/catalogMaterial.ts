export const CATALOG_MATERIAL_KINDS = ["video_embed", "pdf", "quiz", "image", "audio"] as const;

export type CatalogMaterialKind = (typeof CATALOG_MATERIAL_KINDS)[number];

export function parseCatalogMaterialKind(raw: string | undefined): CatalogMaterialKind | null {
  if (!raw) return null;
  return (CATALOG_MATERIAL_KINDS as readonly string[]).includes(raw) ? (raw as CatalogMaterialKind) : null;
}
