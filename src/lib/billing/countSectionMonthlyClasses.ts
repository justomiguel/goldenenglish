import type { SectionScheduleSlot } from "@/types/academics";

/**
 * Pure helper: cuenta cuántas ocurrencias del schedule semanal de la sección
 * caen dentro de la intersección de ventanas dada.
 *
 * Una "clase" es un slot del schedule (un día de la semana) que cae en una
 * fecha específica del calendario. Si una sección dicta lunes y miércoles a la
 * misma hora, eso son 2 slots semanales y se cuentan como 2 clases por semana.
 *
 * Las ventanas son inclusivas en `from`/`until` (al estilo `BETWEEN`).
 *
 * Devuelve 0 si la ventana es vacía o el schedule no tiene slots.
 */
export interface CountClassesArgs {
  /** Días de la semana (0=Dom..6=Sáb) que dicta la sección. */
  scheduleSlots: readonly Pick<SectionScheduleSlot, "dayOfWeek">[];
  /** Inicio de la ventana (UTC). */
  from: Date;
  /** Fin de la ventana inclusivo (UTC). */
  until: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function countSectionMonthlyClasses(args: CountClassesArgs): number {
  const { scheduleSlots, from, until } = args;
  if (!scheduleSlots || scheduleSlots.length === 0) return 0;
  const start = toUtcMidnight(from);
  const end = toUtcMidnight(until);
  if (end.getTime() < start.getTime()) return 0;

  const days = new Set<number>();
  for (const s of scheduleSlots) {
    const dow = Number(s.dayOfWeek);
    if (Number.isInteger(dow) && dow >= 0 && dow <= 6) days.add(dow);
  }
  if (days.size === 0) return 0;

  const totalDays = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  let count = 0;
  for (let i = 0; i < totalDays; i++) {
    const dow = (start.getUTCDay() + i) % 7;
    if (days.has(dow)) count += 1;
  }
  return count;
}

/**
 * Devuelve el primer y último día (UTC, inclusivo) del mes calendario.
 */
export function monthBounds(year: number, month: number): { from: Date; until: Date } {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const until = new Date(Date.UTC(year, month, 0));
  return { from, until };
}

/**
 * Intersección de dos rangos UTC. Devuelve null si la intersección es vacía.
 */
export function intersectDateRange(
  a: { from: Date; until: Date },
  b: { from: Date; until: Date },
): { from: Date; until: Date } | null {
  const from = a.from.getTime() > b.from.getTime() ? a.from : b.from;
  const until = a.until.getTime() < b.until.getTime() ? a.until : b.until;
  if (from.getTime() > until.getTime()) return null;
  return { from, until };
}
