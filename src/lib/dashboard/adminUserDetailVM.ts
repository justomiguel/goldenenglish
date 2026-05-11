import type { AdminStudentCurrentCohortAssignment } from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";

/** Linked guardian row for admin student profile. */
export type AdminUserTutorLinkVM = {
  tutorId: string;
  displayName: string;
  emailDisplay: string;
  /** Raw `tutor_student_rel.relationship` — codes from `TUTOR_STUDENT_RELATIONSHIP_CODES` or legacy free text. */
  relationshipCode: string | null;
};

/** Student linked to a guardian (`parent`) for admin tutor profile — inverse of tutor links on students. */
export type AdminUserTutorFamilyStudentVM = {
  studentId: string;
  displayName: string;
  emailDisplay: string;
  isMinor: boolean;
  financialAccessActive: boolean;
  /** Raw `tutor_student_rel.relationship` from this guardian↔student link. */
  relationshipCode: string | null;
};

/** Section where at least one of the tutor's linked students has an active enrollment (billing / becas). */
export type AdminUserTutorFamilySectionOptionVM = {
  sectionId: string;
  sectionLabel: string;
};

/** Serializable view model for admin user detail (any role). */
export type AdminUserDetailVM = {
  userId: string;
  email: string;
  emailDisplay: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  phoneDisplay: string;
  dniOrPassport: string;
  /** Residential address (formatted); optional. */
  homeAddressText: string;
  /** Google Place ID when chosen from Places; null if typed manually or unknown. */
  homePlaceId: string | null;
  birthDateIso: string | null;
  birthDateDisplay: string | null;
  ageYears: number | null;
  isMinor: boolean;
  assignedTeacherName: string | null;
  createdAtDisplay: string;
  avatarDisplayUrl: string | null;
  tutorLinks: AdminUserTutorLinkVM[];
  /** Populated when `role === "parent"`: students this guardian is linked to. */
  tutorLinkedStudents: AdminUserTutorFamilyStudentVM[];
  /** Sections with at least one active enrollment among `tutorLinkedStudents` (for family-wide scholarships). */
  tutorFamilyScholarshipSections: AdminUserTutorFamilySectionOptionVM[];
  currentCohortAssignment: AdminStudentCurrentCohortAssignment | null;
  /** Other profiles in the same tutor↔student household (for optional bulk home address). */
  familyHomeAddressPeerIds: string[];
  /** Only `profiles.role === 'admin'` may edit inline fields and passwords (server + UI). */
  viewerMayInlineEdit: boolean;
};
