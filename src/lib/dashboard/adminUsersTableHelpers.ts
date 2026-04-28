import {
  compareProfileNamesByLastThenFirst,
  formatProfileNameSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";

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
};

export type SortKey = "email" | "name" | "role" | "phone";
export type SortDir = "asc" | "desc";

export const ROLE_FILTER_ALL = "all" as const;

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
