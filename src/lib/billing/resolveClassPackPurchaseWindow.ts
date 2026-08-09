import { periodIndex } from "@/lib/billing/scholarshipPeriod";

export type ClassPackPurchaseActor = "family" | "staff";

export interface ClassPackPurchaseWindowArgs {
  target: { year: number; month: number };
  current: { year: number; month: number };
  actor: ClassPackPurchaseActor;
}

export type ClassPackPurchaseWindowResult =
  | { allowed: true }
  | { allowed: false; reason: "past_period" | "invalid_period" };

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

/**
 * ¿Puede este actor comprar un paquete para `(year, month)`?
 *
 * La familia compra el mes en curso o meses futuros. Un mes pasado solo lo registra el staff, porque
 * comprar hacia atrás es conciliación: si la familia pudiera, cargaría créditos sobre clases ya
 * asistidas y ya en deuda.
 *
 * Vive acá y en ningún otro lado para que la acción del portal y la del admin no se separen. No hay
 * columna de configuración: nadie pidió configurar esto, y `allow_advance_monthly_payment` es por
 * sección y no puede gobernar una bolsa del alumno.
 */
export function resolveClassPackPurchaseWindow(
  args: ClassPackPurchaseWindowArgs,
): ClassPackPurchaseWindowResult {
  const { target, current, actor } = args;

  const validPeriod =
    Number.isInteger(target.year) &&
    Number.isInteger(target.month) &&
    target.year >= MIN_YEAR &&
    target.year <= MAX_YEAR &&
    target.month >= 1 &&
    target.month <= 12;
  if (!validPeriod) return { allowed: false, reason: "invalid_period" };

  if (actor === "staff") return { allowed: true };

  const isPast = periodIndex(target.year, target.month) < periodIndex(current.year, current.month);
  return isPast ? { allowed: false, reason: "past_period" } : { allowed: true };
}
