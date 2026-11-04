export const TEMPLATE_SECTION_IDS = [
  "inicio",
  "historia",
  "oferta",
  "modalidades",
  "niveles",
  "equipo",
  "certificaciones",
  "contacto",
] as const;

export type TemplateSectionId = (typeof TEMPLATE_SECTION_IDS)[number];

export function templateNavItems(
  labels: Record<TemplateSectionId, string>,
  ids: readonly TemplateSectionId[] = TEMPLATE_SECTION_IDS,
) {
  return ids.map((id) => [id, labels[id]] as const);
}
