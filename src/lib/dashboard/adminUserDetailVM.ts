/** Serializable view model for admin user detail (any role). */
export type AdminUserDetailVM = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  dniOrPassport: string;
  birthDateDisplay: string | null;
  ageYears: number | null;
  assignedTeacherName: string | null;
  createdAtDisplay: string;
  avatarDisplayUrl: string | null;
};
