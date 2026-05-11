/**
 * Stored in `public.tutor_student_rel.relationship` — stable codes for i18n labels.
 * Legacy rows may contain arbitrary text; UI shows it verbatim when unknown.
 */
export const TUTOR_STUDENT_RELATIONSHIP_CODES = [
  "mother",
  "father",
  "legal_guardian",
  "grandparent",
  "step_parent",
  "sibling",
  "other_relative",
  "other",
] as const;

export type TutorStudentRelationshipCode = (typeof TUTOR_STUDENT_RELATIONSHIP_CODES)[number];

export function isTutorStudentRelationshipCode(value: string): value is TutorStudentRelationshipCode {
  return (TUTOR_STUDENT_RELATIONSHIP_CODES as readonly string[]).includes(value);
}
