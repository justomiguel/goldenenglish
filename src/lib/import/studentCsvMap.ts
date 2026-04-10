import type { CsvStudentRow } from "@/lib/import/studentRowSchema";

/** Normaliza encabezados tipo ALUMNOS GOLDEN (ES/EN). */
const HEADER_ALIASES: Record<string, keyof CsvStudentRow | "skip"> = {
  nombre: "first_name",
  apellido: "last_name",
  apellidos: "last_name",
  first_name: "first_name",
  last_name: "last_name",
  dni: "dni_or_passport",
  documento: "dni_or_passport",
  dni_or_passport: "dni_or_passport",
  pasaporte: "dni_or_passport",
  telefono: "phone",
  phone: "phone",
  tel: "phone",
  email: "email",
  correo: "email",
  birth_date: "birth_date",
  fecha_nacimiento: "birth_date",
  nacimiento: "birth_date",
  nivel: "level",
  level: "level",
  cefr: "level",
  año: "academic_year",
  anio: "academic_year",
  academic_year: "academic_year",
  año_lectivo: "academic_year",
};

function normKey(k: string): string {
  return k
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "_");
}

export function mapCsvRecord(raw: Record<string, unknown>): CsvStudentRow | null {
  const out: Partial<CsvStudentRow> = {};

  for (const [key, val] of Object.entries(raw)) {
    const nk = normKey(key);
    const target = HEADER_ALIASES[nk];
    if (!target || target === "skip") continue;
    if (val === undefined || val === null || String(val).trim() === "") continue;
    const s = String(val).trim();
    if (target === "level") {
      const up = s.toUpperCase();
      if (/^A1|A2|B1|B2|C1|C2$/.test(up)) out.level = up as CsvStudentRow["level"];
      continue;
    }
    if (target === "academic_year") {
      out.academic_year = Number.parseInt(s, 10);
      continue;
    }
    (out as Record<string, unknown>)[target] = s;
  }

  if (!out.first_name || !out.last_name || !out.dni_or_passport) return null;
  return out as CsvStudentRow;
}

export function mapCsvRecords(rows: Record<string, unknown>[]): CsvStudentRow[] {
  return rows.map(mapCsvRecord).filter((r): r is CsvStudentRow => r !== null);
}
