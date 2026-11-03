import type { SupabaseClient } from "@supabase/supabase-js";
import { parseHashtagList } from "@/lib/courses/catalogHashtag";
import {
  courseFieldSubmissionIsValid,
  type CourseFieldDefinitionRule,
  type CourseFieldKind,
  type CourseFieldSubmission,
} from "@/lib/courses/courseFieldValues";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

type DefinitionRow = {
  id: string;
  kind: CourseFieldKind;
  required: boolean;
  course_field_options: { id: string }[] | null;
};

export async function loadCourseFieldRules(supabase: SupabaseClient): Promise<CourseFieldDefinitionRule[] | null> {
  const { data, error } = await supabase
    .from("course_field_definitions")
    .select("id, kind, required, course_field_options(id)")
    .order("sort_order", { ascending: true })
    .range(0, 49);
  if (error) {
    logSupabaseClientError("loadCourseFieldRules", error, {});
    return null;
  }
  return ((data ?? []) as DefinitionRow[]).map((row) => ({
    id: row.id,
    kind: row.kind,
    required: row.required,
    optionIds: (row.course_field_options ?? []).map((option) => option.id),
  }));
}

export function courseFieldsAccept(
  rules: CourseFieldDefinitionRule[],
  values: CourseFieldSubmission[],
): boolean {
  return courseFieldSubmissionIsValid(rules, values);
}

async function hashtagId(supabase: SupabaseClient, userId: string, label: string): Promise<string | null> {
  const existing = await supabase.from("catalog_hashtags").select("id").eq("label", label).maybeSingle();
  if (existing.error) {
    logSupabaseClientError("persistCourseCatalog:hashtagLookup", existing.error, {});
    return null;
  }
  if (existing.data?.id) return String(existing.data.id);
  const inserted = await supabase
    .from("catalog_hashtags")
    .insert({ label, created_by: userId })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    logSupabaseClientError("persistCourseCatalog:hashtagInsert", inserted.error, {});
    return null;
  }
  return String(inserted.data.id);
}

function valueColumns(kind: CourseFieldKind, value: CourseFieldSubmission) {
  if (kind === "text") return { value_text: value.text?.trim() || null, option_id: null, value_bool: null, value_date: null };
  if (kind === "dropdown") return { value_text: null, option_id: value.optionId ?? null, value_bool: null, value_date: null };
  if (kind === "checkbox") return { value_text: null, option_id: null, value_bool: Boolean(value.checked), value_date: null };
  return { value_text: null, option_id: null, value_bool: null, value_date: value.date ?? null };
}

export async function persistCourseCatalog(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  input: { hashtags: string; values: CourseFieldSubmission[]; rules: CourseFieldDefinitionRule[] },
): Promise<boolean> {
  const labels = parseHashtagList(input.hashtags);
  const ids: string[] = [];
  for (const label of labels) {
    const id = await hashtagId(supabase, userId, label);
    if (!id) return false;
    ids.push(id);
  }
  if (ids.length > 0) {
    const { error } = await supabase.from("course_hashtags").insert(ids.map((id) => ({ course_id: courseId, hashtag_id: id })));
    if (error) {
      logSupabaseClientError("persistCourseCatalog:links", error, { courseId });
      return false;
    }
  }
  const byId = new Map(input.rules.map((rule) => [rule.id, rule]));
  const rows = input.values.flatMap((value) => {
    const rule = byId.get(value.fieldId);
    if (!rule) return [];
    return [{ course_id: courseId, field_id: value.fieldId, updated_by: userId, ...valueColumns(rule.kind, value) }];
  });
  if (rows.length === 0) return true;
  const { error } = await supabase.from("course_field_values").insert(rows);
  if (error) {
    logSupabaseClientError("persistCourseCatalog:values", error, { courseId });
    return false;
  }
  return true;
}
