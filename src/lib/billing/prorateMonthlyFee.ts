/**
 * Prorratea una cuota mensual proporcionalmente a las clases que el alumno
 * tuvo disponibles en el mes vs. las clases que tuvo la sección entera.
 *
 * Ejemplo: 4 clases en el mes, alumno entró cuando solo quedaba 1 → paga 1/4
 * de la cuota mensual.
 *
 * Reglas:
 * - Si `totalClassesInMonth <= 0`: el mes está fuera del rango operativo de
 *   la sección. Devuelve `code: "out_of_period"`.
 * - Si `availableClassesForStudent <= 0`: el alumno no tuvo clases ese mes
 *   (entró después o se desinscribió antes). Devuelve `code: "out_of_period"`.
 * - Si `available >= total`: cuota completa.
 * - En el medio: redondeo financiero a 2 decimales (banker's rounding-free,
 *   half away from zero).
 */
export type ProrateResult =
  | { code: "ok"; amount: number; numerator: number; denominator: number; full: boolean }
  | { code: "out_of_period" };

export interface ProrateArgs {
  monthlyFee: number;
  totalClassesInMonth: number;
  availableClassesForStudent: number;
}

function roundTo2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function prorateMonthlyFee(args: ProrateArgs): ProrateResult {
  const { monthlyFee, totalClassesInMonth, availableClassesForStudent } = args;
  if (!Number.isFinite(monthlyFee) || monthlyFee < 0) {
    return { code: "out_of_period" };
  }
  if (totalClassesInMonth <= 0 || availableClassesForStudent <= 0) {
    return { code: "out_of_period" };
  }
  if (availableClassesForStudent >= totalClassesInMonth) {
    return {
      code: "ok",
      amount: roundTo2(monthlyFee),
      numerator: totalClassesInMonth,
      denominator: totalClassesInMonth,
      full: true,
    };
  }
  const factor = availableClassesForStudent / totalClassesInMonth;
  return {
    code: "ok",
    amount: roundTo2(monthlyFee * factor),
    numerator: availableClassesForStudent,
    denominator: totalClassesInMonth,
    full: false,
  };
}
