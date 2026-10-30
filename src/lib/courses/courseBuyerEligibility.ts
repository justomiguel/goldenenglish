import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";

export type CourseBuyerRole = "student" | "parent" | "other";

export type CourseSelfPayResult =
  | { ok: true }
  | { ok: false; code: "not_student" | "missing_birth_date" | "minor" };

/**
 * Self-pay is only for a student at or above the institute age of majority.
 * A missing birth date blocks self-pay. A parent uses a different path.
 */
export function courseSelfPayAllowed(input: {
  role: CourseBuyerRole;
  birthDate: string | null;
  legalAgeMajority: number;
  today?: Date;
}): CourseSelfPayResult {
  if (input.role !== "student") return { ok: false, code: "not_student" };
  const birthDate = input.birthDate?.trim() ?? "";
  if (!birthDate) return { ok: false, code: "missing_birth_date" };
  const years = fullYearsFromIsoDate(birthDate, input.today ?? new Date());
  if (years < input.legalAgeMajority) return { ok: false, code: "minor" };
  return { ok: true };
}

export function courseParentPayAllowed(role: CourseBuyerRole): boolean {
  return role === "parent";
}
