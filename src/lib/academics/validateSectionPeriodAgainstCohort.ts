import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type SectionPeriodValidationCode = "PARSE" | "ORDER";

export type SectionPeriodValidation =
  | { ok: true }
  | { ok: false; code: SectionPeriodValidationCode };

/**
 * Validates section period ISO dates: parseable and start ≤ end.
 * Cohort-level date bounds are not used; section dates are owned by each section.
 */
export function validateSectionPeriodAgainstCohort(input: {
  sectionStartsOn: string;
  sectionEndsOn: string;
  cohortStartsOn?: string | null;
  cohortEndsOn?: string | null;
}): SectionPeriodValidation {
  void input.cohortStartsOn;
  void input.cohortEndsOn;
  const a = isoDate.safeParse(input.sectionStartsOn.trim());
  const b = isoDate.safeParse(input.sectionEndsOn.trim());
  if (!a.success || !b.success) return { ok: false, code: "PARSE" };
  if (a.data > b.data) return { ok: false, code: "ORDER" };
  return { ok: true };
}
