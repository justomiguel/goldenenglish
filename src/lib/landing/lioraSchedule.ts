/**
 * Horario público de Liora Studio. Los horarios son datos (no copy), pero el
 * nombre de la sede y de la clase se resuelven contra `dict.landing.liora.*`
 * para que sigan siendo traducibles y editables desde el CMS.
 */
export type LioraSedeKey = "sanMiguel" | "providencia" | "maipu";

export type LioraClassKey = "preBallet" | "infantil" | "juvenil" | "adulto";

export interface LioraScheduleSlot {
  /** Rango horario en formato 24h local (Santiago). */
  time: string;
  classKey: LioraClassKey;
  /** Rango de edad puntual del bloque; puede diferir del rango general del nivel. */
  ages: string;
}

export interface LioraSedeSchedule {
  sedeKey: LioraSedeKey;
  slots: ReadonlyArray<LioraScheduleSlot>;
}

export const LIORA_SATURDAY_SCHEDULE: ReadonlyArray<LioraSedeSchedule> = [
  {
    sedeKey: "sanMiguel",
    slots: [
      { time: "09:00 – 10:00", classKey: "infantil", ages: "6 a 9" },
      { time: "10:00 – 11:00", classKey: "preBallet", ages: "3 a 5" },
    ],
  },
  {
    sedeKey: "providencia",
    slots: [
      { time: "16:00 – 17:00", classKey: "preBallet", ages: "3 a 4" },
      { time: "17:00 – 18:00", classKey: "infantil", ages: "6 a 9" },
    ],
  },
  {
    sedeKey: "maipu",
    slots: [{ time: "19:00 – 20:00", classKey: "adulto", ages: "15+" }],
  },
];

export const LIORA_SEDE_KEYS: ReadonlyArray<LioraSedeKey> = [
  "providencia",
  "maipu",
  "sanMiguel",
];

export const LIORA_CLASS_KEYS: ReadonlyArray<LioraClassKey> = [
  "preBallet",
  "infantil",
  "juvenil",
  "adulto",
];
