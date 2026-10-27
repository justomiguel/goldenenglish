import {
  compareProfileNamesByLastThenFirst,
  formatProfileNameSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";
import { directoryBillingMarkSortRank } from "@/lib/dashboard/directoryBillingStatus";
import type { AdminUsersSortCriterion } from "@/lib/dashboard/adminUsersSortCriteria";
import type { AdminUserRow, SortDir, SortKey } from "@/lib/dashboard/adminUsersTableHelpers";
import { compareSortValues } from "@/lib/sort/compareSortValues";

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

function compareAdminUserRow(a: AdminUserRow, b: AdminUserRow, key: SortKey, dir: SortDir): number {
  const mult = dir === "asc" ? 1 : -1;
  if (key === "name") {
    return (
      compareProfileNamesByLastThenFirst(
        { firstName: a.firstName, lastName: a.lastName },
        { firstName: b.firstName, lastName: b.lastName },
      ) * mult
    );
  }
  if (key === "lastAccess") {
    return (a.lastSessionStartAt ?? "").localeCompare(b.lastSessionStartAt ?? "") * mult;
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
  if (key === "monthlyDue") return (monthlyDueSortValue(a) - monthlyDueSortValue(b)) * mult;
  if (key === "lastEnrollment") return compareSortValues(a.lastEnrollmentAt, b.lastEnrollmentAt, dir);
  if (key === "enrollmentFee") {
    return compareSortValues(
      directoryBillingMarkSortRank(a.enrollmentFeeStatus),
      directoryBillingMarkSortRank(b.enrollmentFeeStatus),
      dir,
    );
  }
  if (key === "monthlyStatus") {
    return compareSortValues(
      directoryBillingMarkSortRank(a.monthlyStatus),
      directoryBillingMarkSortRank(b.monthlyStatus),
      dir,
    );
  }
  const va = a[key];
  const vb = b[key];
  return String(va).localeCompare(String(vb), undefined, { sensitivity: "base" }) * mult;
}

export function sortAdminUsers(
  rows: AdminUserRow[],
  key: SortKey | AdminUsersSortCriterion[],
  dir: SortDir = "asc",
): AdminUserRow[] {
  const criteria: AdminUsersSortCriterion[] = Array.isArray(key)
    ? key.length > 0
      ? key
      : [{ key: "name", dir: "asc" }]
    : [{ key, dir }];
  const copy = [...rows];
  copy.sort((a, b) => {
    for (const criterion of criteria) {
      const cmp = compareAdminUserRow(a, b, criterion.key, criterion.dir);
      if (cmp !== 0) return cmp;
    }
    return a.id.localeCompare(b.id);
  });
  return copy;
}
