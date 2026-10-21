import type { Dictionary } from "@/types/i18n";
import {
  isAdminParentsDirectory,
  isAdminStudentsDirectory,
  isAdminTeachersDirectory,
  type SortKey,
} from "@/lib/dashboard/adminUsersTableHelpers";

type UserLabels = Dictionary["admin"]["users"];

export const DIRECTORY_SORT_KEYS: SortKey[] = ["email", "name", "role", "phone"];
export const STUDENT_SORT_KEYS: SortKey[] = [
  "name",
  "sections",
  "monthlyDue",
  "monthlyStatus",
  "enrollmentFee",
  "lastEnrollment",
  "parent",
];
export const TEACHER_SORT_KEYS: SortKey[] = ["email", "name", "sections", "phone"];
export const PARENT_SORT_KEYS: SortKey[] = [
  "name",
  "email",
  "children",
  "sections",
  "monthlyStatus",
  "enrollmentFee",
  "lastEnrollment",
  "lastAccess",
];

export function adminUsersSortKeysForLock(lockRole?: string): SortKey[] {
  if (isAdminStudentsDirectory(lockRole)) return STUDENT_SORT_KEYS;
  if (isAdminParentsDirectory(lockRole)) return PARENT_SORT_KEYS;
  if (isAdminTeachersDirectory(lockRole)) return TEACHER_SORT_KEYS;
  return DIRECTORY_SORT_KEYS;
}

export function adminUsersSortColumnLabel(labels: UserLabels, key: SortKey): string {
  switch (key) {
    case "email":
      return labels.colEmail;
    case "name":
      return labels.colName;
    case "role":
      return labels.colRole;
    case "phone":
      return labels.colPhone;
    case "lastAccess":
      return labels.colLastAccess;
    case "sections":
      return labels.colSections;
    case "monthlyDue":
      return labels.colMonthlyDue;
    case "monthlyStatus":
      return labels.colMonthlyStatus;
    case "enrollmentFee":
      return labels.colEnrollmentFee;
    case "lastEnrollment":
      return labels.colLastEnrollment;
    case "parent":
      return labels.colParent;
    case "children":
      return labels.colChildren;
    default:
      return key;
  }
}
