"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { categoryParentCreatesCycle } from "@/lib/courses/categoryCycle";
import { parseFieldOptionLabels } from "@/lib/courses/courseFieldValues";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  logServerActionException,
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

type CatalogResult = { ok: true } | { ok: false; code: "unauthorized" | "invalid_input" | "persist_failed" };

const LocaleSchema = z.string().min(2).max(8);

function deny(error: unknown, scope: string): CatalogResult {
  if (error instanceof Error && (error.message === ADMIN_SESSION_UNAUTHORIZED || error.message === ADMIN_SESSION_FORBIDDEN)) {
    logServerAuthzDenied(scope, { reason: error.message });
    return { ok: false, code: "unauthorized" };
  }
  logServerActionException(scope, error);
  return { ok: false, code: "persist_failed" };
}

function refresh(locale: string) {
  revalidateAcademicSurfaces(locale);
  revalidatePath(`/${locale}/dashboard/admin/academic/contents`);
}

export async function createCourseCategoryAction(raw: unknown): Promise<CatalogResult> {
  const parsed = z
    .object({
      locale: LocaleSchema,
      name: z.string().trim().min(1).max(120),
      parentId: z.string().uuid().nullable(),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { data: rows, error: listError } = await supabase
      .from("course_categories")
      .select("id, parent_id")
      .range(0, 499);
    if (listError) {
      logSupabaseClientError("createCourseCategoryAction:list", listError, {});
      return { ok: false, code: "persist_failed" };
    }
    const parentById = new Map((rows ?? []).map((row) => [String(row.id), (row.parent_id as string | null) ?? null]));
    if (parsed.data.parentId && !parentById.has(parsed.data.parentId)) return { ok: false, code: "invalid_input" };
    if (categoryParentCreatesCycle("new", parsed.data.parentId, parentById)) return { ok: false, code: "invalid_input" };
    const { data, error } = await supabase
      .from("course_categories")
      .insert({
        name: parsed.data.name,
        parent_id: parsed.data.parentId,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      logSupabaseClientError("createCourseCategoryAction:insert", error, {});
      return { ok: false, code: "persist_failed" };
    }
    await recordSystemAudit({
      action: "course_category.create",
      resourceType: "course_category",
      resourceId: String(data.id),
      payload: { parent: Boolean(parsed.data.parentId) },
    });
    refresh(parsed.data.locale);
    return { ok: true };
  } catch (error) {
    return deny(error, "createCourseCategoryAction");
  }
}

export async function createCourseFieldAction(raw: unknown): Promise<CatalogResult> {
  const parsed = z
    .object({
      locale: LocaleSchema,
      name: z.string().trim().min(1).max(80),
      kind: z.enum(["text", "dropdown", "checkbox", "date"]),
      required: z.boolean(),
      options: z.string().max(2000),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const optionLabels = parsed.data.kind === "dropdown" ? parseFieldOptionLabels(parsed.data.options) : [];
  if (parsed.data.kind === "dropdown" && optionLabels.length === 0) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { count, error: countError } = await supabase
      .from("course_field_definitions")
      .select("id", { count: "exact", head: true });
    if (countError) {
      logSupabaseClientError("createCourseFieldAction:count", countError, {});
      return { ok: false, code: "persist_failed" };
    }
    if ((count ?? 0) >= 50) return { ok: false, code: "invalid_input" };
    const { data, error } = await supabase
      .from("course_field_definitions")
      .insert({
        name: parsed.data.name,
        kind: parsed.data.kind,
        required: parsed.data.required,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      logSupabaseClientError("createCourseFieldAction:insert", error, {});
      return { ok: false, code: "persist_failed" };
    }
    if (optionLabels.length > 0) {
      const { error: optionError } = await supabase.from("course_field_options").insert(
        optionLabels.map((label, index) => ({ field_id: data.id, label, sort_order: index })),
      );
      if (optionError) {
        logSupabaseClientError("createCourseFieldAction:options", optionError, { fieldId: data.id });
        return { ok: false, code: "persist_failed" };
      }
    }
    await recordSystemAudit({
      action: "course_field.create",
      resourceType: "course_field_definition",
      resourceId: String(data.id),
      payload: { kind: parsed.data.kind },
    });
    refresh(parsed.data.locale);
    return { ok: true };
  } catch (error) {
    return deny(error, "createCourseFieldAction");
  }
}

const ProgramSetSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    completion: z.enum(["all_in_order", "all_any_order", "at_least"]),
    atLeastCount: z.number().int().min(1).max(20).nullable(),
    courseIds: z.array(z.string().uuid()).min(1).max(20),
  })
  .refine((set) => (set.completion === "at_least" ? set.atLeastCount !== null : set.atLeastCount === null));

export async function createLearningProgramAction(raw: unknown): Promise<CatalogResult> {
  const parsed = z
    .object({
      locale: LocaleSchema,
      title: z.string().trim().min(1).max(180),
      sets: z.array(ProgramSetSchema).min(1).max(8),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { data: program, error } = await supabase
      .from("learning_programs")
      .insert({ title: parsed.data.title, created_by: user.id, updated_by: user.id })
      .select("id")
      .single();
    if (error || !program) {
      logSupabaseClientError("createLearningProgramAction:program", error, {});
      return { ok: false, code: "persist_failed" };
    }
    for (const [index, set] of parsed.data.sets.entries()) {
      const { data: saved, error: setError } = await supabase
        .from("learning_program_sets")
        .insert({
          program_id: program.id,
          title: set.title,
          completion: set.completion,
          at_least_count: set.atLeastCount,
          sort_order: index,
        })
        .select("id")
        .single();
      if (setError || !saved) {
        logSupabaseClientError("createLearningProgramAction:set", setError, { programId: program.id });
        return { ok: false, code: "persist_failed" };
      }
      const { error: courseError } = await supabase.from("learning_program_set_courses").insert(
        set.courseIds.map((courseId, courseIndex) => ({
          set_id: saved.id,
          course_id: courseId,
          sort_order: courseIndex,
        })),
      );
      if (courseError) {
        logSupabaseClientError("createLearningProgramAction:courses", courseError, { programId: program.id });
        return { ok: false, code: "persist_failed" };
      }
    }
    await recordSystemAudit({
      action: "learning_program.create",
      resourceType: "learning_program",
      resourceId: String(program.id),
      payload: { sets: parsed.data.sets.length },
    });
    refresh(parsed.data.locale);
    return { ok: true };
  } catch (error) {
    return deny(error, "createLearningProgramAction");
  }
}

export async function assignProgramToSectionAction(raw: unknown): Promise<CatalogResult> {
  const parsed = z
    .object({
      locale: LocaleSchema,
      sectionId: z.string().uuid(),
      programId: z.string().uuid(),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { error } = await supabase.from("section_program_assignments").insert({
      section_id: parsed.data.sectionId,
      program_id: parsed.data.programId,
      created_by: user.id,
    });
    if (error) {
      logSupabaseClientError("assignProgramToSectionAction", error, {});
      return { ok: false, code: "persist_failed" };
    }
    await recordSystemAudit({
      action: "learning_program.assign_section",
      resourceType: "section_program_assignment",
      resourceId: parsed.data.sectionId,
      payload: { program_id: parsed.data.programId },
    });
    refresh(parsed.data.locale);
    revalidatePath(`/${parsed.data.locale}/dashboard/student/progress`);
    return { ok: true };
  } catch (error) {
    return deny(error, "assignProgramToSectionAction");
  }
}
