import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";

export type AdminTourStepDef = {
  anchor: AdminTourAnchor | null;
  title: string;
  description: string;
  /** On Next: navigate to academic hub and wait for New cohort. */
  navigateToAcademicHub?: boolean;
  /** On Next: check for an existing year cohort, then open modal or stop the tour. */
  checkExistingCohortOnNext?: boolean;
  /** On Next: dispatch open new-cohort modal and wait for name field. */
  openNewCohortModal?: boolean;
  /** On Next: ensure cohort sections tab is active. */
  activateCohortSectionsTab?: boolean;
  /** On Next: dispatch open new-section modal and wait for basics field. */
  openNewSectionModal?: boolean;
  /** On Next: end pre-modal phase (create-cohort or create-section). */
  endPreModal?: boolean;
  /** In-tour branch: two footer actions (use existing cohort vs create new). */
  existingCohortBranch?: boolean;
  /** After landing on cohort detail: offer the create-section tutorial. */
  handoffCreateSectionTour?: boolean;
  /** In-tour branch: minor (with tutor) vs adult (no tutor) student path. */
  studentBirthPathBranch?: boolean;
  /** On highlight: set the create-user role `<select>` value. */
  setCreateUserRole?: "student" | "teacher" | "admin";
  /** Skip this step when the anchor is missing from the DOM (e.g. conditional banner). */
  optional?: boolean;
};
