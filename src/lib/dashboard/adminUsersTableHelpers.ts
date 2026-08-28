import {
  compareProfileNamesByLastThenFirst,
  formatProfileNameSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";
import type { MonthlyDueTotal } from "@/lib/billing/sumDiscountedMonthlyDue";
import type {
  AdminStudentDirectoryParent,
  AdminStudentDirectorySection,
} from "@/lib/dashboard/loadAdminStudentDirectoryExtras";

export type AdminUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  /** Signed or absolute URL for list avatar; null if none. */
  avatarDisplayUrl: string | null;
  /** Student with no active `section_enrollment` (non-students: always false). */
  missingSection: boolean;
  /** Active section enrollments (students) or lead/assistant assignments (teachers). */
  sections: AdminStudentDirectorySection[];
  /** Linked tutors/guardians — populated on the students directory. */
  parents: AdminStudentDirectoryParent[];
  /** Current-month due across active sections after scholarships. */
  monthlyDue: MonthlyDueTotal[];
};

export type SortKey = "email" | "name" | "role" | "phone";
export type SortDir = "asc" | "desc";

export const ROLE_FILTER_ALL = "all" as const;

export const EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS = {
  sections: [] as AdminStudentDirectorySection[],
  parents: [] as AdminStudentDirectoryParent[],
  monthlyDue: [] as MonthlyDueTotal[],
};

export function isAdminStudentsDirectory(lockRole?: string): boolean {
  return lockRole === "student";
}

export function isAdminTeachersDirectory(lockRole?: string): boolean {
  return lockRole === "teacher";
}

export function adminUserRowAriaName(row: AdminUserRow): string {
  const name = formatProfileNameSurnameFirst(row.firstName, row.lastName);
  return name || row.email;
}

export function filterAdminUsers(
  rows: AdminUserRow[],
  query: string,
  roleFilter: string,
): AdminUserRow[] {
  let next = rows;
  if (roleFilter !== ROLE_FILTER_ALL) {
    next = next.filter(
      (r) => r.role.toLowerCase() === roleFilter.toLowerCase(),
    );
  }
  const q = query.trim().toLowerCase();
  if (!q) return next;
  return next.filter((row) => {
    const fullName = formatProfileNameSurnameFirst(row.firstName, row.lastName);
    const sectionSearch =
      row.missingSection && row.role.toLowerCase() === "student"
        ? "sin-seccion sin-sección no-section missing-section"
        : "";
    const hay = [
      row.email,
      row.firstName,
      row.lastName,
      fullName,
      row.role,
      row.phone,
      sectionSearch,
      ...row.sections.flatMap((s) => [
        s.name,
        s.discountPercent != null ? `${s.discountPercent}%` : "",
      ]),
      ...row.parents.flatMap((p) => [
        p.firstName,
        p.lastName,
        formatProfileNameSurnameFirst(p.firstName, p.lastName),
      ]),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/** Row checkbox calls this; keeps self-row toggles as no-ops (checkbox is disabled for self). */
export function applyUserRowToggle(
  prev: Set<string>,
  id: string,
  currentUserId: string,
): Set<string> {
  if (id === currentUserId) return prev;
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function sortAdminUsers(
  rows: AdminUserRow[],
  key: SortKey,
  dir: SortDir,
): AdminUserRow[] {
  const copy = [...rows];
  const mult = dir === "asc" ? 1 : -1;
  copy.sort((a, b) => {
    if (key === "name") {
      return compareProfileNamesByLastThenFirst(
        { firstName: a.firstName, lastName: a.lastName },
        { firstName: b.firstName, lastName: b.lastName },
      ) * mult;
    }
    const va = a[key as keyof Pick<AdminUserRow, "email" | "role" | "phone">];
    const vb = b[key as keyof Pick<AdminUserRow, "email" | "role" | "phone">];
    return va.localeCompare(vb, undefined, { sensitivity: "base" }) * mult;
  });
  return copy;
}
