import type { CsvStudentRow } from "@/lib/import/studentRowSchema";

export type ProfileForMerge = {
  id: string;
  role: string;
  phone: string | null;
  birth_date: string | null;
  dni_or_passport: string;
};

function normDni(s: string): string {
  return s.replace(/\./g, "").replace(/\s/g, "").trim();
}

function isEmptyBirth(b: unknown): boolean {
  if (b == null) return true;
  if (typeof b === "string") return b.trim() === "";
  return false;
}

/**
 * Solo rellena campos opcionales vacíos en BD; no sobrescribe valores existentes.
 * Si el DNI del CSV no coincide con el del perfil, marca conflicto (mismo email, otra persona).
 */
export function mergeStudentProfileCsvPatch(
  profile: ProfileForMerge,
  row: CsvStudentRow,
  dniNorm: string,
): { patch: Record<string, unknown>; hasNew: boolean; dniConflict: boolean } {
  const dniDb = normDni(profile.dni_or_passport);
  if (dniDb !== dniNorm) {
    return { patch: {}, hasNew: false, dniConflict: true };
  }
  const patch: Record<string, unknown> = {};
  const phoneIn = row.phone?.trim();
  if (!profile.phone?.trim() && phoneIn) patch.phone = phoneIn;
  if (isEmptyBirth(profile.birth_date) && row.birth_date?.trim()) {
    patch.birth_date = row.birth_date.trim();
  }
  return {
    patch,
    hasNew: Object.keys(patch).length > 0,
    dniConflict: false,
  };
}
