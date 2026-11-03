import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { CourseFieldKind } from "@/lib/courses/courseFieldValues";

export const COURSE_CATEGORY_CAP = 500;

export type CourseCategoryOption = { id: string; parentId: string | null; name: string };
export type CourseFieldFormOption = {
  id: string;
  name: string;
  kind: CourseFieldKind;
  required: boolean;
  options: { id: string; label: string }[];
};
export type LearningProgramOption = { id: string; title: string };
export type CoursePickerOption = { id: string; title: string };

export type CourseCatalogSetup = {
  categories: CourseCategoryOption[];
  fields: CourseFieldFormOption[];
  programs: LearningProgramOption[];
  courseOptions: CoursePickerOption[];
};

type CategoryRow = { id: string; parent_id: string | null; name: string };
type FieldRow = {
  id: string;
  name: string;
  kind: CourseFieldKind;
  required: boolean;
  course_field_options: { id: string; label: string; sort_order: number }[] | null;
};

export function mapCourseCategories(rows: CategoryRow[]): CourseCategoryOption[] {
  return rows.map((row) => ({ id: row.id, parentId: row.parent_id, name: row.name }));
}

export function mapCourseFields(rows: FieldRow[]): CourseFieldFormOption[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    required: row.required,
    options: (row.course_field_options ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((option) => ({ id: option.id, label: option.label })),
  }));
}

export async function loadCourseCatalogSetup(supabase: SupabaseClient): Promise<CourseCatalogSetup> {
  const [categories, fields, programs, courses] = await Promise.all([
    supabase.from("course_categories").select("id, parent_id, name").order("sort_order").order("name").range(0, COURSE_CATEGORY_CAP - 1),
    supabase
      .from("course_field_definitions")
      .select("id, name, kind, required, course_field_options(id, label, sort_order)")
      .order("sort_order")
      .range(0, 49),
    supabase.from("learning_programs").select("id, title").order("title").range(0, 99),
    supabase.from("learning_courses").select("id, title").order("title").range(0, 199),
  ]);
  if (categories.error) logSupabaseClientError("loadCourseCatalogSetup:categories", categories.error, {});
  if (fields.error) logSupabaseClientError("loadCourseCatalogSetup:fields", fields.error, {});
  if (programs.error) logSupabaseClientError("loadCourseCatalogSetup:programs", programs.error, {});
  if (courses.error) logSupabaseClientError("loadCourseCatalogSetup:courses", courses.error, {});
  return {
    categories: mapCourseCategories((categories.data ?? []) as CategoryRow[]),
    fields: mapCourseFields((fields.data ?? []) as FieldRow[]),
    programs: ((programs.data ?? []) as { id: string; title: string }[]).map((row) => ({ id: row.id, title: row.title })),
    courseOptions: ((courses.data ?? []) as { id: string; title: string }[]).map((row) => ({ id: row.id, title: row.title })),
  };
}
