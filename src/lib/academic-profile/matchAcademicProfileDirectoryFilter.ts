import type { AcademicProfileFieldType } from "@/lib/academic-profile/academicProfileFieldRules";

const ACF_PARAM = /^acf_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export type AcademicDirectoryField = {
  id: string;
  fieldType: AcademicProfileFieldType;
  showInDirectory: boolean;
  archivedAt: string | null;
  selectOptions: string[];
};

export type AcademicDirectoryValue = {
  fieldId: string;
  studentId: string;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
};

export function parseAcademicDirectoryParams(
  raw: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string") continue;
    const match = ACF_PARAM.exec(key);
    const trimmed = value.trim();
    if (!match || trimmed.length === 0) continue;
    out[match[1].toLowerCase()] = trimmed;
  }
  return out;
}

export function academicDirectoryFilterCount(params: {
  forEach(fn: (value: string, key: string) => void): void;
}): number {
  const raw: Record<string, string> = {};
  params.forEach((value, key) => {
    raw[key] = value;
  });
  return Object.keys(parseAcademicDirectoryParams(raw)).length;
}

function isColumnType(fieldType: AcademicProfileFieldType): boolean {
  return fieldType !== "file" && fieldType !== "image";
}

export function directoryFieldsForColumns(fields: AcademicDirectoryField[]): AcademicDirectoryField[] {
  return fields.filter(
    (field) => field.archivedAt == null && field.showInDirectory && isColumnType(field.fieldType),
  );
}

function storedText(field: AcademicDirectoryField, value: AcademicDirectoryValue | undefined): string {
  if (!value) return "";
  if (field.fieldType === "number") return value.valueNumber == null ? "" : String(value.valueNumber);
  if (field.fieldType === "date") return value.valueDate ?? "";
  return value.valueText ?? "";
}

function valueMatches(field: AcademicDirectoryField, stored: string, query: string): boolean {
  if (stored.length === 0) return false;
  if (field.fieldType === "text" || field.fieldType === "textarea" || field.fieldType === "email" || field.fieldType === "phone") {
    return stored.toLowerCase().includes(query.toLowerCase());
  }
  return stored === query;
}

export function studentMatchesAcademicDirectoryFilters(
  studentId: string,
  fields: AcademicDirectoryField[],
  values: AcademicDirectoryValue[],
  params: Record<string, string>,
): boolean {
  const columns = directoryFieldsForColumns(fields);
  for (const [fieldId, query] of Object.entries(params)) {
    const field = columns.find((item) => item.id === fieldId);
    if (!field) continue;
    const value = values.find((item) => item.fieldId === fieldId && item.studentId === studentId);
    if (!valueMatches(field, storedText(field, value), query)) return false;
  }
  return true;
}

export function countSelectOptionFacet(
  fieldId: string,
  option: string,
  studentIds: string[],
  fields: AcademicDirectoryField[],
  values: AcademicDirectoryValue[],
  paramsWithoutThisField: Record<string, string>,
): number {
  return studentIds.filter((studentId) => {
    if (!studentMatchesAcademicDirectoryFilters(studentId, fields, values, paramsWithoutThisField)) return false;
    const value = values.find((item) => item.fieldId === fieldId && item.studentId === studentId);
    return value?.valueText === option;
  }).length;
}
