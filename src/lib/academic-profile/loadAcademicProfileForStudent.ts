import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { ACADEMIC_PROFILE_FIELD_TYPES, type AcademicProfileFieldType } from "@/lib/academic-profile/academicProfileFieldRules";
import {
  ACADEMIC_PROFILE_FILES_BUCKET,
  type AcademicProfileCardField,
} from "@/lib/academic-profile/academicProfileCard";

const FIELD_CAP = 200;

type FieldRow = {
  id: string;
  label: string;
  field_type: string;
  select_options: string[] | null;
  required: boolean;
  show_in_directory: boolean;
  sort_order: number;
};

type ValueRow = {
  field_id: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  storage_path: string | null;
};

export async function loadAcademicProfileForStudent(
  supabase: SupabaseClient,
  studentId: string,
): Promise<AcademicProfileCardField[]> {
  const { data, error } = await supabase
    .from("academic_profile_fields")
    .select("id, label, field_type, select_options, required, show_in_directory, sort_order")
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .limit(FIELD_CAP);
  if (error) {
    logSupabaseClientError("loadAcademicProfileForStudent", error, { studentId });
    return [];
  }
  const fields = ((data ?? []) as FieldRow[]).filter(
    (row): row is FieldRow & { field_type: AcademicProfileFieldType } => isFieldType(row.field_type),
  );
  if (fields.length === 0) return [];

  const { data: values, error: valueError } = await supabase
    .from("academic_profile_field_values")
    .select("field_id, value_text, value_number, value_date, storage_path")
    .eq("student_id", studentId);
  if (valueError) {
    logSupabaseClientError("loadAcademicProfileForStudent:values", valueError, { studentId });
  }
  const byField = new Map(((values ?? []) as ValueRow[]).map((row) => [row.field_id, row]));
  const urls = await signPaths((values ?? []) as ValueRow[]);

  return fields.map((field) => {
    const value = byField.get(field.id);
    const storagePath = value?.storage_path ?? null;
    return {
      id: field.id,
      label: field.label,
      fieldType: field.field_type,
      selectOptions: field.select_options ?? [],
      required: field.required,
      showInDirectory: field.show_in_directory,
      valueText: value?.value_text ?? null,
      valueNumber: value?.value_number ?? null,
      valueDate: value?.value_date ?? null,
      storagePath,
      fileUrl: storagePath ? (urls.get(storagePath) ?? null) : null,
    };
  });
}

function isFieldType(value: string): value is AcademicProfileFieldType {
  return (ACADEMIC_PROFILE_FIELD_TYPES as readonly string[]).includes(value);
}

async function signPaths(values: ValueRow[]): Promise<Map<string, string>> {
  const paths = values.map((row) => row.storage_path).filter((path): path is string => Boolean(path));
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const admin = await createAdminClient();
  await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await admin.storage.from(ACADEMIC_PROFILE_FILES_BUCKET).createSignedUrl(path, 3600);
      if (error) {
        logSupabaseClientError("loadAcademicProfileForStudent:sign", error, {});
        return;
      }
      if (data?.signedUrl) urls.set(path, data.signedUrl);
    }),
  );
  return urls;
}
