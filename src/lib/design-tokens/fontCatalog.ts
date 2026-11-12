export type FontCategory = "sans" | "serif" | "display" | "script" | "mono";

export interface FontCatalogEntry {
  id: string;
  family: string;
  category: FontCategory;
  weights: readonly number[];
  owner: string | null;
}

export const FONT_CATALOG: readonly FontCatalogEntry[] = [
  { id: "dm-sans", family: "DM Sans", category: "sans", weights: [400, 500, 600, 700], owner: null },
  { id: "fraunces", family: "Fraunces", category: "serif", weights: [400, 500, 600, 700], owner: null },
  { id: "oswald", family: "Oswald", category: "display", weights: [400, 500, 600, 700], owner: null },
  { id: "outfit", family: "Outfit", category: "sans", weights: [300, 400, 500, 600, 700], owner: null },
  { id: "cormorant-garamond", family: "Cormorant Garamond", category: "serif", weights: [500, 600, 700], owner: null },
  { id: "jost", family: "Jost", category: "sans", weights: [300, 400, 500, 600], owner: null },
  { id: "nunito", family: "Nunito", category: "sans", weights: [400, 500, 600, 700], owner: null },
  { id: "caveat", family: "Caveat", category: "script", weights: [400], owner: null },
  { id: "baloo-2", family: "Baloo 2", category: "display", weights: [400, 600, 700], owner: null },
  { id: "bebas-neue", family: "Bebas Neue", category: "display", weights: [400], owner: null },
  { id: "pacifico", family: "Pacifico", category: "script", weights: [400], owner: null },
  { id: "plus-jakarta-sans", family: "Plus Jakarta Sans", category: "sans", weights: [400, 500, 600, 700], owner: null },
  { id: "jetbrains-mono", family: "JetBrains Mono", category: "mono", weights: [400, 500, 700], owner: null },
  { id: "playfair-display", family: "Playfair Display", category: "serif", weights: [400, 500, 600], owner: null },
  { id: "allura", family: "Allura", category: "script", weights: [400], owner: null },
  { id: "espaciozenit-fast-blaze", family: "Fast Blaze", category: "display", weights: [400], owner: "espaciozenit" },
  { id: "espaciozenit-rusted-vibe", family: "Rusted Vibe", category: "display", weights: [400], owner: "espaciozenit" },
  { id: "espaciozenit-ballet", family: "Ballet", category: "script", weights: [400], owner: "espaciozenit" },
];

function normalizeFontName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findFontByFamily(name: string): FontCatalogEntry | null {
  const key = normalizeFontName(name);
  if (!key) return null;
  return (
    FONT_CATALOG.find(
      (entry) => entry.id === key || normalizeFontName(entry.family) === key,
    ) ?? null
  );
}

export function isFontAllowedForTenant(id: string, tenantSlug: string | null): boolean {
  const entry = FONT_CATALOG.find((font) => font.id === id);
  if (!entry) return false;
  if (entry.owner === null) return true;
  return entry.owner === tenantSlug;
}
