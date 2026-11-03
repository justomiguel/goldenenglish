export const GENERIC_INSTITUTE_KINDS = [
  "deportes",
  "jardin",
  "colegio",
  "musica",
  "idiomas",
] as const;

export type GenericInstituteKind = (typeof GENERIC_INSTITUTE_KINDS)[number];

export const DEFAULT_GENERIC_THEME_SLUG = "generic-idiomas";

export const GENERIC_LANDING_SECTIONS = [
  "inicio",
  "historia",
  "oferta",
  "modalidades",
  "niveles",
  "certificaciones",
] as const;

export type GenericLandingSection = (typeof GENERIC_LANDING_SECTIONS)[number];

/** Ink and paper for generated icons and the share card. */
export const GENERIC_KIND_RGB: Record<
  GenericInstituteKind,
  { ink: [number, number, number]; paper: [number, number, number] }
> = {
  deportes: { ink: [27, 67, 50], paper: [246, 241, 232] },
  jardin: { ink: [61, 90, 69], paper: [251, 247, 240] },
  colegio: { ink: [28, 43, 58], paper: [244, 240, 234] },
  musica: { ink: [74, 44, 58], paper: [247, 243, 238] },
  idiomas: { ink: [30, 58, 76], paper: [247, 245, 242] },
};

/** Same colors as `233_generic_institute_theme_seeds.sql`. */
const GENERIC_KIND_COLORS: Record<
  GenericInstituteKind,
  {
    primary: string;
    primaryDark: string;
    secondary: string;
    ink: string;
    paper: string;
    surface: string;
    muted: string;
    mutedFg: string;
  }
> = {
  deportes: { primary: "#1B4332", primaryDark: "#0F2A1F", secondary: "#C4A484", ink: "#1B4332", paper: "#F6F1E8", surface: "#FFFCF7", muted: "#E7DDD0", mutedFg: "#3D4A40" },
  jardin: { primary: "#3D5A45", primaryDark: "#24362A", secondary: "#E2C56B", ink: "#24362A", paper: "#FBF7F0", surface: "#FFFCF6", muted: "#E6E0D2", mutedFg: "#3D4A40" },
  colegio: { primary: "#1C2B3A", primaryDark: "#101820", secondary: "#B08968", ink: "#1C2B3A", paper: "#F4F0EA", surface: "#FBF8F4", muted: "#E4DDD4", mutedFg: "#3A4654" },
  musica: { primary: "#4A2C3A", primaryDark: "#2C1A24", secondary: "#C6A15B", ink: "#4A2C3A", paper: "#F7F3EE", surface: "#FBF8F4", muted: "#E8DFD6", mutedFg: "#5C4652" },
  idiomas: { primary: "#1E3A4C", primaryDark: "#122632", secondary: "#E6D3B3", ink: "#1E3A4C", paper: "#F7F5F2", surface: "#FBF9F6", muted: "#E4E0D8", mutedFg: "#3E5160" },
};

export interface GenericTemplatePalette {
  primary: string;
  accent: string;
  paper: string;
}

export function genericKindDefaultPalette(kind: GenericInstituteKind): GenericTemplatePalette {
  const row = GENERIC_KIND_COLORS[kind];
  return { primary: row.primary, accent: row.secondary, paper: row.paper };
}

/** Color overrides so a preview renders with the template palette. */
export function genericKindColorOverrides(kind: GenericInstituteKind): Record<string, string> {
  const row = GENERIC_KIND_COLORS[kind];
  return {
    "color.primary": row.primary,
    "color.primary.dark": row.primaryDark,
    "color.primary.foreground": row.paper,
    "color.secondary": row.secondary,
    "color.secondary.foreground": row.ink,
    "color.accent": row.secondary,
    "color.background": row.paper,
    "color.surface": row.surface,
    "color.foreground": row.ink,
    "color.muted": row.muted,
    "color.muted.foreground": row.mutedFg,
    "color.border": row.muted,
  };
}

export function isGenericInstituteKind(
  kind: string | null | undefined,
): kind is GenericInstituteKind {
  return GENERIC_INSTITUTE_KINDS.includes(kind as GenericInstituteKind);
}

export function genericThemeSlug(kind: GenericInstituteKind): string {
  return `generic-${kind}`;
}

export function genericKindFromThemeSlug(slug: string): GenericInstituteKind | null {
  const prefix = "generic-";
  if (!slug.startsWith(prefix)) return null;
  const kind = slug.slice(prefix.length);
  return isGenericInstituteKind(kind) ? kind : null;
}

/** Stock files under `public/generic`. Uploads do not land here. */
export function genericStockPath(
  kind: GenericInstituteKind,
  file: "favicon.svg" | "favicon.png" | "mark.svg" | "hero.svg",
): string {
  return `/generic/${kind}/${file}`;
}

/** One photo per landing section. Empty slots use this file. */
export function genericSectionStockPath(
  kind: GenericInstituteKind,
  section: GenericLandingSection,
): string {
  return `/generic/${kind}/${section}.jpg`;
}

/** Keep a custom slug visible when the tenant does not use a generic template. */
export function genericTemplateSelectOptions(currentSlug: string): string[] {
  const slugs = GENERIC_INSTITUTE_KINDS.map((kind) => genericThemeSlug(kind));
  if (currentSlug && !slugs.includes(currentSlug)) return [currentSlug, ...slugs];
  return slugs;
}
