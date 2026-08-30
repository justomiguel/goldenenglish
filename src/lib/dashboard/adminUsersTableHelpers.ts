import {
  compareProfileNamesByLastThenFirst,
  formatProfileNameSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";
import type { MonthlyDueTotal } from "@/lib/billing/sumDiscountedMonthlyDue";
import type {
  AdminStudentDirectoryParent,
  AdminStudentDirectorySection,
} from "@/lib/dashboard/loadAdminStudentDirectoryExtras";
import {
  directoryBillingMarkSortRank,
  type DirectoryBillingMark,
} from "@/lib/dashboard/directoryBillingStatus";
import { compareSortValues } from "@/lib/sort/compareSortValues";

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
  /** Linked students — populated on the parents directory. */
  children: AdminStudentDirectoryParent[];
  /** Current-month due across active sections after scholarships. */
  monthlyDue: MonthlyDueTotal[];
  /** Monthly cuota current / overdue / not applicable. */
  monthlyStatus: DirectoryBillingMark;
  /** Charged enrollment fees paid / unpaid / not charged. */
  enrollmentFeeStatus: DirectoryBillingMark;
  /** Latest active `section_enrollments.created_at` (parent: max of children). */
  lastEnrollmentAt: string | null;
  lastSessionStartAt: string | null;
  emailDeliverable: boolean;
};

export type SortKey =
  | "email"
  | "name"
  | "role"
  | "phone"
  | "lastAccess"
  | "sections"
  | "monthlyDue"
  | "parent"
  | "children"
  | "lastEnrollment"
  | "enrollmentFee";
export type SortDir = "asc" | "desc";

function sectionsSortValue(row: AdminUserRow): string {
  if (row.missingSection) return "";
  return row.sections.map((section) => section.name).join("\0");
}

function peopleSortValue(people: { firstName: string; lastName: string }[]): string {
  return people
    .map((person) => formatProfileNameSurnameFirst(person.firstName, person.lastName))
    .join("\0");
}

function monthlyDueSortValue(row: AdminUserRow): number {
  return row.monthlyDue.reduce((sum, line) => sum + line.amount, 0);
}

export const ROLE_FILTER_ALL = "all" as const;

export const EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS = {
  sections: [] as AdminStudentDirectorySection[],
  parents: [] as AdminStudentDirectoryParent[],
  children: [] as AdminStudentDirectoryParent[],
  monthlyDue: [] as MonthlyDueTotal[],
  monthlyStatus: "na" as DirectoryBillingMark,
  enrollmentFeeStatus: "na" as DirectoryBillingMark,
  lastEnrollmentAt: null as string | null,
  lastSessionStartAt: null as string | null,
  emailDeliverable: false,
};

export function isAdminStudentsDirectory(lockRole?: string): boolean {
  return lockRole === "student";
}

export function isAdminTeachersDirectory(lockRole?: string): boolean {
  return lockRole === "teacher";
}

export function isAdminParentsDirectory(lockRole?: string): boolean {
  return lockRole === "parent";
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
    if (key === "lastAccess") {
      const va = a.lastSessionStartAt ?? "";
      const vb = b.lastSessionStartAt ?? "";
      return va.localeCompare(vb) * mult;
    }
    if (key === "sections") {
      return (
        sectionsSortValue(a).localeCompare(sectionsSortValue(b), undefined, {
          sensitivity: "base",
          numeric: true,
        }) * mult
      );
    }
    if (key === "parent") {
      return (
        peopleSortValue(a.parents).localeCompare(peopleSortValue(b.parents), undefined, {
          sensitivity: "base",
        }) * mult
      );
    }
    if (key === "children") {
      return (
        peopleSortValue(a.children).localeCompare(peopleSortValue(b.children), undefined, {
          sensitivity: "base",
        }) * mult
      );
    }
    if (key === "monthlyDue") {
      return (monthlyDueSortValue(a) - monthlyDueSortValue(b)) * mult;
    }
    if (key === "lastEnrollment") {
      return compareSortValues(a.lastEnrollmentAt, b.lastEnrollmentAt, dir);
    }
    if (key === "enrollmentFee") {
      return compareSortValues(
        directoryBillingMarkSortRank(a.enrollmentFeeStatus),
        directoryBillingMarkSortRank(b.enrollmentFeeStatus),
        dir,
      );
    }
    const va = a[key as keyof Pick<AdminUserRow, "email" | "role" | "phone">];
    const vb = b[key as keyof Pick<AdminUserRow, "email" | "role" | "phone">];
    return va.localeCompare(vb, undefined, { sensitivity: "base" }) * mult;
  });
  return copy;
}
