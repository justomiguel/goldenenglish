export const CENTROLISTO_ENTITY_NAME = "CentroListo";

const BRAND_TAIL = /\s*\|\s*(?:centro\s*listo|centrolisto)\s*$/i;
const BRAND_ONLY = /^(?:centro\s*listo|centrolisto)$/i;

/** Page topic plus the entity name, once. */
export function centrolistoDocumentTitle(segment: string): string {
  let core = segment.replace(/\s+/g, " ").trim();
  while (BRAND_TAIL.test(core)) core = core.replace(BRAND_TAIL, "").trim();
  if (!core || BRAND_ONLY.test(core)) return CENTROLISTO_ENTITY_NAME;
  return `${core} | ${CENTROLISTO_ENTITY_NAME}`;
}
