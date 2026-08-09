/**
 * Who may read a student's care notes, and on what grounds.
 *
 * Kept free of Supabase so the rule itself is one cheap unit test away from
 * every branch. `loadStudentCareNotes` gathers the facts and is the only place
 * allowed to act on the answer.
 */

export type CareViewerFacts = {
  isAdmin: boolean;
  isTutorOfStudent: boolean;
  /** Viewer teaches or assists a section the student is enrolled in. */
  sharesSectionWithStudent: boolean;
  isStudentThemselves: boolean;
};

export type CareViewerRole = "admin" | "tutor" | "section_staff" | null;

export function resolveCareViewerRole(facts: CareViewerFacts): CareViewerRole {
  if (facts.isAdmin) return "admin";

  // A student is trivially "in a section with" themselves, so this has to be
  // checked before the section path or the notes leak to the person they are
  // written about.
  if (facts.isStudentThemselves) return null;

  if (facts.isTutorOfStudent) return "tutor";
  if (facts.sharesSectionWithStudent) return "section_staff";
  return null;
}
