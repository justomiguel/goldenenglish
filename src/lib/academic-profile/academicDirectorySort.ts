import type { AcademicProfileFieldType } from "@/lib/academic-profile/academicProfileFieldRules";
import type { AdminUsersSortCriterion } from "@/lib/dashboard/adminUsersSortCriteria";
import type { SortableValue } from "@/lib/sort/compareSortValues";

const ACF_SORT_KEY =
  /^acf:([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export type AcademicFieldSortKey = `acf:${string}`;

export function academicFieldSortKey(fieldId: string): AcademicFieldSortKey {
  return `acf:${fieldId.toLowerCase()}`;
}

export function academicFieldIdFromSortKey(value: string): string | null {
  const match = ACF_SORT_KEY.exec(value.trim());
  return match ? match[1].toLowerCase() : null;
}

export function isAcademicFieldSortKey(value: string): value is AcademicFieldSortKey {
  return academicFieldIdFromSortKey(value) != null;
}

export function academicDirectorySortValue(
  fieldType: AcademicProfileFieldType,
  value:
    | { valueText: string | null; valueNumber: number | null; valueDate: string | null }
    | undefined,
): SortableValue {
  if (!value) return null;
  if (fieldType === "number") return value.valueNumber;
  if (fieldType === "date") {
    const date = value.valueDate?.trim() ?? "";
    return date.length === 0 ? null : date;
  }
  const text = value.valueText?.trim() ?? "";
  return text.length === 0 ? null : text;
}

export function resolveDirectorySortCriteria(
  criteria: AdminUsersSortCriterion[],
  columnFieldIds: ReadonlySet<string>,
): AdminUsersSortCriterion[] {
  const allowed = new Set([...columnFieldIds].map((id) => id.toLowerCase()));
  const kept = criteria.filter((criterion) => {
    const fieldId = academicFieldIdFromSortKey(criterion.key);
    if (!fieldId) return true;
    return allowed.has(fieldId);
  });
  return kept.length > 0 ? kept : [{ key: "name", dir: "asc" }];
}
