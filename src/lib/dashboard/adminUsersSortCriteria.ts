import {
  academicFieldIdFromSortKey,
  academicFieldSortKey,
  isAcademicFieldSortKey,
  type AcademicFieldSortKey,
} from "@/lib/academic-profile/academicDirectorySort";
import type { SortDir, SortKey } from "@/lib/dashboard/adminUsersTableHelpers";

export type AdminDirectorySortKey = SortKey | AcademicFieldSortKey;
export type AdminUsersSortCriterion = { key: AdminDirectorySortKey; dir: SortDir };

const SORT_KEYS: readonly SortKey[] = [
  "email",
  "name",
  "role",
  "phone",
  "lastAccess",
  "sections",
  "monthlyDue",
  "parent",
  "children",
  "lastEnrollment",
  "enrollmentFee",
  "monthlyStatus",
];

function isSortKey(value: string): value is AdminDirectorySortKey {
  return isAcademicFieldSortKey(value) || (SORT_KEYS as readonly string[]).includes(value);
}

function normalizeSortKey(value: string): AdminDirectorySortKey {
  const fieldId = academicFieldIdFromSortKey(value);
  if (fieldId) return academicFieldSortKey(fieldId);
  return value as SortKey;
}

function dedupe(criteria: AdminUsersSortCriterion[]): AdminUsersSortCriterion[] {
  const seen = new Set<string>();
  const out: AdminUsersSortCriterion[] = [];
  for (const criterion of criteria) {
    if (seen.has(criterion.key)) continue;
    seen.add(criterion.key);
    out.push(criterion);
  }
  return out;
}

export function parseAdminUsersSortCriteria(raw: {
  order?: unknown;
  sort?: unknown;
  dir?: unknown;
}): AdminUsersSortCriterion[] {
  const order = typeof raw.order === "string" ? raw.order.trim() : "";
  if (order) {
    const parsed: AdminUsersSortCriterion[] = [];
    for (const part of order.split(",")) {
      const splitAt = part.lastIndexOf(":");
      const key = (splitAt < 0 ? part : part.slice(0, splitAt)).trim();
      const dirRaw = splitAt < 0 ? "" : part.slice(splitAt + 1).trim();
      if (!isSortKey(key)) continue;
      parsed.push({ key: normalizeSortKey(key), dir: dirRaw === "desc" ? "desc" : "asc" });
    }
    const unique = dedupe(parsed);
    if (unique.length > 0) return unique;
  }
  const sort =
    typeof raw.sort === "string" && isSortKey(raw.sort) ? normalizeSortKey(raw.sort) : "name";
  const dir: SortDir = raw.dir === "desc" ? "desc" : "asc";
  return [{ key: sort, dir }];
}

export function serializeAdminUsersSortCriteria(criteria: AdminUsersSortCriterion[]): string {
  return criteria.map((criterion) => `${criterion.key}:${criterion.dir}`).join(",");
}

export function adminUsersSortCriteriaToParams(criteria: AdminUsersSortCriterion[]): {
  order?: string;
  sort?: string;
  dir?: string;
} {
  const list = criteria.length > 0 ? criteria : [{ key: "name" as const, dir: "asc" as const }];
  const first = list[0];
  const isDefault = list.length === 1 && first.key === "name" && first.dir === "asc";
  if (isDefault) return { order: undefined, sort: undefined, dir: undefined };
  return {
    order: serializeAdminUsersSortCriteria(list),
    sort: first.key,
    dir: first.dir === "asc" ? undefined : first.dir,
  };
}

export function cycleAdminUsersSortCriterion(
  criteria: AdminUsersSortCriterion[],
  key: AdminUsersSortCriterion["key"],
): AdminUsersSortCriterion[] {
  const sole = criteria.length === 1 && criteria[0]?.key === key;
  if (!sole) return [{ key, dir: "asc" }];
  return [{ key, dir: criteria[0].dir === "asc" ? "desc" : "asc" }];
}

export function setAdminUsersSortChecked(
  criteria: AdminUsersSortCriterion[],
  key: AdminDirectorySortKey,
  checked: boolean,
): AdminUsersSortCriterion[] {
  if (!checked) {
    const next = criteria.filter((criterion) => criterion.key !== key);
    return next.length > 0 ? next : [{ key: "name", dir: "asc" }];
  }
  if (criteria.some((criterion) => criterion.key === key)) return criteria;
  return [...criteria, { key, dir: "asc" }];
}

export function setAdminUsersSortDir(
  criteria: AdminUsersSortCriterion[],
  key: AdminDirectorySortKey,
  dir: SortDir,
): AdminUsersSortCriterion[] {
  return criteria.map((criterion) => (criterion.key === key ? { key, dir } : criterion));
}

export function replaceAdminUsersSortKey(
  criteria: AdminUsersSortCriterion[],
  index: number,
  nextKey: AdminDirectorySortKey,
): AdminUsersSortCriterion[] {
  if (index < 0 || index >= criteria.length) return criteria;
  if (criteria[index].key === nextKey) return criteria;
  const other = criteria.findIndex((criterion) => criterion.key === nextKey);
  const next = criteria.map((criterion) => ({ ...criterion }));
  if (other >= 0) next[other] = { ...next[other], key: criteria[index].key };
  next[index] = { ...next[index], key: nextKey };
  return next;
}

export function addAdminUsersSortCriterion(
  criteria: AdminUsersSortCriterion[],
  sortKeys: readonly AdminDirectorySortKey[],
): AdminUsersSortCriterion[] {
  const used = new Set(criteria.map((criterion) => criterion.key));
  const key = sortKeys.find((candidate) => !used.has(candidate));
  if (!key) return criteria;
  return [...criteria, { key, dir: "asc" }];
}

export function moveAdminUsersSortCriterion(
  criteria: AdminUsersSortCriterion[],
  key: AdminDirectorySortKey,
  delta: -1 | 1,
): AdminUsersSortCriterion[] {
  const index = criteria.findIndex((criterion) => criterion.key === key);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= criteria.length) return criteria;
  const next = [...criteria];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function adminUsersProfileSortColumns(
  criteria: AdminUsersSortCriterion[],
): { column: string; ascending: boolean }[] {
  const list = criteria.length > 0 ? criteria : [{ key: "name" as const, dir: "asc" as const }];
  const seen = new Set<string>();
  const out: { column: string; ascending: boolean }[] = [];
  for (const criterion of list) {
    const columns =
      criterion.key === "name"
        ? ["last_name", "first_name"]
        : criterion.key === "email"
          ? ["last_name"]
          : criterion.key === "role"
            ? ["role"]
            : criterion.key === "phone"
              ? ["phone"]
              : criterion.key === "lastAccess"
                ? ["last_session_start_at"]
                : [];
    for (const column of columns) {
      if (seen.has(column)) continue;
      seen.add(column);
      out.push({ column, ascending: criterion.dir === "asc" });
    }
  }
  if (!seen.has("id")) out.push({ column: "id", ascending: true });
  return out;
}
