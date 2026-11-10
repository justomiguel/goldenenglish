import { EXCLUSIVE_THEME_OWNERS } from "@/lib/theme/exclusiveThemeKinds";

export const GENERIC_INSTITUTE_KINDS = [
  "deportes",
  "jardin",
  "colegio",
  "musica",
  "idiomas",
  "deportes2",
  "jardin2",
  "colegio2",
  "idiomas2",
  "musica2",
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
  deportes2: { ink: [244, 244, 240], paper: [18, 20, 16] },
  jardin2: { ink: [36, 49, 44], paper: [244, 239, 228] },
  colegio2: { ink: [244, 239, 230], paper: [14, 26, 43] },
  idiomas2: { ink: [17, 17, 17], paper: [247, 244, 236] },
  musica2: { ink: [245, 241, 234], paper: [9, 9, 11] },
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
  deportes2: { primary: "#C6F531", primaryDark: "#8FB000", secondary: "#F4F4F0", ink: "#F4F4F0", paper: "#121410", surface: "#1C1F1A", muted: "#2A2E28", mutedFg: "#C8C8C0" },
  jardin2: { primary: "#3E5C45", primaryDark: "#2A4030", secondary: "#C4785A", ink: "#24312C", paper: "#F4EFE4", surface: "#FBF7F0", muted: "#E4D9CC", mutedFg: "#4A564F" },
  colegio2: { primary: "#FF5C24", primaryDark: "#C43E10", secondary: "#F3EDE4", ink: "#F3EDE4", paper: "#0E1A2B", surface: "#162536", muted: "#243246", mutedFg: "#D5D0C8" },
  idiomas2: { primary: "#1D3BFF", primaryDark: "#0E1F99", secondary: "#E6FF3A", ink: "#111111", paper: "#F7F4EC", surface: "#FFFFFF", muted: "#E7E2D6", mutedFg: "#3A3A3A" },
  musica2: { primary: "#FF4B1F", primaryDark: "#C4320C", secondary: "#B388FF", ink: "#F5F1EA", paper: "#09090B", surface: "#16161A", muted: "#2A2A30", mutedFg: "#D5D0C8" },
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
  if (kind === "deportes2" || kind === "jardin2" || kind === "colegio2" || kind === "idiomas2" || kind === "musica2") {
    return `/generic/${kind}/inicio.png`;
  }
  return `/generic/${kind}/${section}.jpg`;
}

export function genericPreviewSrc(kind: GenericInstituteKind): string {
  if (kind === "deportes2" || kind === "jardin2" || kind === "colegio2" || kind === "idiomas2" || kind === "musica2") {
    return `/generic/${kind}/preview.png`;
  }
  return `/generic/${kind}/preview.jpg`;
}

/** Keep a custom slug visible when the tenant does not use a generic template. */
export function genericTemplateSelectOptions(currentSlug: string): string[] {
  const slugs = GENERIC_INSTITUTE_KINDS.map((kind) => genericThemeSlug(kind));
  if (currentSlug && !slugs.includes(currentSlug)) return [currentSlug, ...slugs];
  return slugs;
}

/**
 * Slugs the staff tenant form may offer. Generic slugs always. An exclusive
 * kind only when the tenant slug owns it, so `matiss` never appears for
 * another institute.
 */
export function staffTemplateSelectOptions(
  currentSlug: string,
  tenantSlug: string,
): string[] {
  const options = genericTemplateSelectOptions(currentSlug);
  for (const [kind, owners] of Object.entries(EXCLUSIVE_THEME_OWNERS)) {
    if (owners?.includes(tenantSlug) && !options.includes(kind)) options.push(kind);
  }
  return options;
}
