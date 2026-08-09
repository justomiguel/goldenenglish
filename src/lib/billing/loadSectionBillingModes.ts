import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Lee `academic_sections.billing_mode` para un conjunto acotado de secciones.
 *
 * Va en una consulta aparte, y no sumada a los `select` con join que ya hacen las vistas de cobranzas,
 * por una razón operativa: la migración que agrega la columna puede no estar aplicada todavía en una base
 * dada. Sumarla a esos `select` haría fallar toda la consulta con `42703` y dejaría la pantalla de pagos
 * vacía. Aislada acá, el peor caso es un mapa vacío, que los llamadores interpretan como cobro mensual —
 * exactamente el comportamiento actual.
 *
 * Devuelve el valor **crudo**: decidir qué significa es de `parseSectionBillingMode`.
 */
export async function loadSectionBillingModes(
  supabase: SupabaseClient,
  sectionIds: readonly string[],
): Promise<Map<string, string | null>> {
  const ids = [...new Set(sectionIds)];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("academic_sections")
    .select("id, billing_mode")
    .in("id", ids);

  // `Array.isArray` y no solo `!data`: este helper no debe poder tumbar una pantalla de cobranzas por una
  // respuesta con una forma inesperada. Sin filas conocidas ⇒ cobro mensual.
  if (error || !Array.isArray(data)) return new Map();

  const rows = data as { id: string; billing_mode: string | null }[];
  return new Map(rows.map((row) => [row.id, row.billing_mode ?? null]));
}
