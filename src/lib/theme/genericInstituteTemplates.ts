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
