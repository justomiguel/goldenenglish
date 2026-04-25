import type { AdminStudentCurrentCohortAssignment } from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";

/** Linked guardian row for admin student profile. */
export type AdminUserTutorLinkVM = {
  tutorId: string;
  displayName: string;
  emailDisplay: string;
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
  birthDateIso: string | null;
  birthDateDisplay: string | null;
  ageYears: number | null;
  isMinor: boolean;
  assignedTeacherName: string | null;
  createdAtDisplay: string;
  avatarDisplayUrl: string | null;
  tutorLinks: AdminUserTutorLinkVM[];
  currentCohortAssignment: AdminStudentCurrentCohortAssignment | null;
  /** Only `profiles.role === 'admin'` may edit inline fields and passwords (server + UI). */
  viewerMayInlineEdit: boolean;
};
