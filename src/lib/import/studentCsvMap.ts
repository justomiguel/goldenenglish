import type { CsvStudentRow } from "@/lib/import/studentRowSchema";
import { normalizeBirthDateString } from "@/lib/import/birthDateNormalize";

/** Normalize headers like ALUMNOS GOLDEN (ES/EN) and Google Forms export columns. */
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
  /** Google Forms / Golden templates */
  direccion_de_correo_electronico: "email",
  birth_date: "birth_date",
  fecha_nacimiento: "birth_date",
  fecha_nacimi: "birth_date",
  nacimiento: "birth_date",
  nivel: "level",
  level: "level",
  cefr: "level",
  año: "academic_year",
  anio: "academic_year",
  academic_year: "academic_year",
  año_lectivo: "academic_year",
  dni_tutor: "tutor_dni",
  tutor_dni: "tutor_dni",
  dni_del_tutor: "tutor_dni",
  tutor_documento: "tutor_dni",
  email_tutor: "tutor_email",
  tutor_email: "tutor_email",
  nombre_tutor: "tutor_first_name",
  nombre_del_tutor: "tutor_first_name",
  tutor_nombre: "tutor_first_name",
  apellido_tutor: "tutor_last_name",
  tutor_apellido: "tutor_last_name",
  telefono_tutor: "tutor_phone",
  tutor_telefono: "tutor_phone",
  cntacto_tutor: "tutor_phone",
  contacto_tutor: "tutor_phone",
  cuota: "monthly_fee",
  cuota_mensual: "monthly_fee",
  monthly_fee: "monthly_fee",
  /** Columns ignored in templates (e.g. free-form notes). */
  observaciones: "skip",
  notas: "skip",
  marca_temporal: "skip",
  edad: "skip",
  localidad: "skip",
  profesor: "skip",
  insc: "skip",
  exam: "skip",
  mar: "skip",
  abr: "skip",
  may: "skip",
  jun: "skip",
  jul: "skip",
  ago: "skip",
  sept: "skip",
  oct: "skip",
  nov: "skip",
  dic: "skip",
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
    if (target === "birth_date") {
      const iso = normalizeBirthDateString(s);
      if (iso) (out as Record<string, unknown>).birth_date = iso;
      continue;
    }
    if (target === "monthly_fee") {
      const n = Number.parseFloat(s.replace(",", "."));
      if (!Number.isNaN(n)) out.monthly_fee = n;
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
