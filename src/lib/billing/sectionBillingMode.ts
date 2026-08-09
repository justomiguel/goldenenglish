/**
 * Cómo se cobra una sección: cuota fija mensual o bolsa mensual de clases prepagas.
 *
 * A diferencia de {@link import("./monthlyFeeChargeMode").parseMonthlyFeeChargeMode}, este parser es
 * **estricto** a propósito. Aquel devuelve `'prorate_by_classes'` ante cualquier valor desconocido, y
 * un modo nuevo con esa semántica haría que todo código que aún no lo conozca cobre una cuota
 * prorrateada en silencio. Acá un valor desconocido devuelve `null` y el llamador expone un error
 * tipado: preferimos fallar visible antes que mover plata mal.
 */

export const SECTION_BILLING_MODES = ["section_monthly_fee", "class_pack"] as const;

export type SectionBillingMode = (typeof SECTION_BILLING_MODES)[number];

export const DEFAULT_SECTION_BILLING_MODE: SectionBillingMode = "section_monthly_fee";

export function parseSectionBillingMode(raw: unknown): SectionBillingMode | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return (SECTION_BILLING_MODES as readonly string[]).includes(value)
    ? (value as SectionBillingMode)
    : null;
}

/**
 * Solo `'class_pack'` califica. Un valor desconocido devuelve `false`, de modo que ninguna sección se
 * saque del cobro mensual por un dato corrupto.
 */
export function sectionIsClassPackBilled(raw: unknown): boolean {
  return parseSectionBillingMode(raw) === "class_pack";
}
