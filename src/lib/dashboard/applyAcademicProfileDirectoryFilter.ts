import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import {
  ACADEMIC_PROFILE_FIELD_TYPES,
  type AcademicProfileFieldType,
} from "@/lib/academic-profile/academicProfileFieldRules";
import {
  academicDirectorySortValue,
  academicFieldSortKey,
} from "@/lib/academic-profile/academicDirectorySort";
import {
  countSelectOptionFacet,
  directoryFieldsForColumns,
  studentMatchesAcademicDirectoryFilters,
  type AcademicDirectoryField,
  type AcademicDirectoryValue,
} from "@/lib/academic-profile/matchAcademicProfileDirectoryFilter";
import type { SortableValue } from "@/lib/sort/compareSortValues";

export type AcademicDirectoryColumn = { id: string; label: string; fieldType: AcademicProfileFieldType; selectOptions: string[] };

type FieldRow = AcademicDirectoryField & { label: string };

export async function applyAcademicProfileDirectoryFilter(
  supabase: SupabaseClient,
  studentIds: string[],
  params: Record<string, string>,
): Promise<{
  ids: string[];
  columns: AcademicDirectoryColumn[];
  cellsByStudent: Map<string, string[]>;
  sortValuesByStudent: Map<string, Record<string, SortableValue>>;
  selectFacets: Record<string, Record<string, number>>;
}> {
  const fields = await loadColumnFields(supabase);
  const columns = directoryFieldsForColumns(fields).map((field) => ({
    id: field.id,
    label: fields.find((row) => row.id === field.id)?.label ?? field.id,
    fieldType: field.fieldType,
    selectOptions: field.selectOptions,
  }));
  if (columns.length === 0 || studentIds.length === 0) {
    return { ids: studentIds, columns, cellsByStudent: new Map(), sortValuesByStudent: new Map(), selectFacets: {} };
  }
  const values = await loadValues(supabase, studentIds);
  const activeParams = Object.fromEntries(
    Object.entries(params).filter(([fieldId]) => columns.some((column) => column.id === fieldId)),
  );
  const ids = studentIds.filter((studentId) =>
    studentMatchesAcademicDirectoryFilters(studentId, fields, values, activeParams),
  );
  const cellsByStudent = new Map(
    ids.map((studentId) => [studentId, columns.map((column) => cellText(column, values, studentId))]),
  );
  const sortValuesByStudent = new Map(
    ids.map((studentId) => [studentId, sortBag(columns, values, studentId)]),
  );
  const selectFacets: Record<string, Record<string, number>> = {};
  for (const column of columns) {
    if (column.fieldType !== "select") continue;
    const rest = { ...activeParams };
    delete rest[column.id];
    selectFacets[column.id] = {};
    for (const option of column.selectOptions) {
      selectFacets[column.id][option] = countSelectOptionFacet(column.id, option, studentIds, fields, values, rest);
    }
  }
  return { ids, columns, cellsByStudent, sortValuesByStudent, selectFacets };
}

async function loadColumnFields(supabase: SupabaseClient): Promise<FieldRow[]> {
  const { data } = await supabase
    .from("academic_profile_fields")
    .select("id, label, field_type, select_options, show_in_directory, archived_at")
    .is("archived_at", null)
    .eq("show_in_directory", true)
    .order("sort_order", { ascending: true })
    .limit(200);
  return ((data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => isFieldType(String(row.field_type)))
    .map((row) => ({
      id: String(row.id),
      label: String(row.label),
      fieldType: String(row.field_type) as AcademicProfileFieldType,
      showInDirectory: true,
      archivedAt: null,
      selectOptions: Array.isArray(row.select_options) ? row.select_options.map(String) : [],
    }));
}

async function loadValues(supabase: SupabaseClient, studentIds: string[]): Promise<AcademicDirectoryValue[]> {
  const rows = await chunkedIn<Record<string, unknown>>(
    supabase,
    "academic_profile_field_values",
    "student_id",
    studentIds,
    "student_id, field_id, value_text, value_number, value_date",
  );
  return rows.map((row) => ({
    studentId: String(row.student_id),
    fieldId: String(row.field_id),
    valueText: row.value_text == null ? null : String(row.value_text),
    valueNumber: typeof row.value_number === "number" ? row.value_number : null,
    valueDate: row.value_date == null ? null : String(row.value_date),
  }));
}

function sortBag(
  columns: AcademicDirectoryColumn[],
  values: AcademicDirectoryValue[],
  studentId: string,
): Record<string, SortableValue> {
  const bag: Record<string, SortableValue> = {};
  for (const column of columns) {
    const value = values.find((row) => row.studentId === studentId && row.fieldId === column.id);
    bag[academicFieldSortKey(column.id)] = academicDirectorySortValue(column.fieldType, value);
  }
  return bag;
}

function cellText(column: AcademicDirectoryColumn, values: AcademicDirectoryValue[], studentId: string): string {
  const value = values.find((row) => row.studentId === studentId && row.fieldId === column.id);
  if (!value) return "";
  const text = column.fieldType === "number"
    ? (value.valueNumber == null ? "" : String(value.valueNumber))
    : column.fieldType === "date"
      ? (value.valueDate ?? "")
      : (value.valueText ?? "");
  return column.fieldType === "textarea" && text.length > 120 ? text.slice(0, 120) : text;
}

function isFieldType(value: string): value is AcademicProfileFieldType {
  return (ACADEMIC_PROFILE_FIELD_TYPES as readonly string[]).includes(value);
}
