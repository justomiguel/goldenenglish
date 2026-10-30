"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { courseSlugFromTitle } from "@/lib/courses/courseSlug";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import {
  logServerActionException,
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const LessonSchema = z.object({
  title: z.string().trim().min(1).max(180),
  contentTemplateId: z.string().uuid(),
});

const ModuleSchema = z.object({
  title: z.string().trim().min(1).max(180),
  lessons: z.array(LessonSchema).min(1).max(40),
});

const CreateCourseSchema = z.object({
  locale: z.string().min(2).max(8),
  title: z.string().trim().min(1).max(180),
  progressMode: z.enum(["open", "sequential"]),
  price: z.number().min(0).max(1_000_000),
  listedInShop: z.boolean(),
  modules: z.array(ModuleSchema).min(1).max(20),
});

export type CreateCourseResult =
  | { ok: true; id: string }
  | { ok: false; code: "unauthorized" | "invalid_input" | "persist_failed" };

async function unusedCourseSlug(supabase: SupabaseClient, title: string): Promise<string> {
  const taken = new Set<string>();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = courseSlugFromTitle(title, taken);
    const { data, error } = await supabase.from("learning_courses").select("id").eq("slug", slug).maybeSingle();
    if (error) {
      logSupabaseClientError("createCourseAction:slug", error, {});
      return slug;
    }
    if (!data) return slug;
    taken.add(slug);
  }
  return courseSlugFromTitle(title, taken);
}

export async function createCourseAction(raw: unknown): Promise<CreateCourseResult> {
  const parsed = CreateCourseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  try {
    const { supabase, user } = await assertAdmin();
    const data = parsed.data;
    const slug = data.listedInShop ? await unusedCourseSlug(supabase, data.title) : null;

    const { data: course, error: courseError } = await supabase
      .from("learning_courses")
      .insert({
        title: data.title,
        slug,
        status: "published",
        progress_mode: data.progressMode,
        price: data.price,
        listed_in_shop: data.listedInShop,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (courseError || !course) {
      logSupabaseClientError("createCourseAction:course", courseError, {});
      return { ok: false, code: "persist_failed" };
    }

    for (const [moduleIndex, module] of data.modules.entries()) {
      const { data: savedModule, error: moduleError } = await supabase
        .from("course_modules")
        .insert({ course_id: course.id, title: module.title, sort_order: moduleIndex })
        .select("id")
        .single();
      if (moduleError || !savedModule) {
        logSupabaseClientError("createCourseAction:module", moduleError, { courseId: course.id });
        return { ok: false, code: "persist_failed" };
      }
      const { error: lessonError } = await supabase.from("course_lessons").insert(
        module.lessons.map((lesson, lessonIndex) => ({
          module_id: savedModule.id,
          content_template_id: lesson.contentTemplateId,
          title: lesson.title,
          sort_order: lessonIndex,
        })),
      );
      if (lessonError) {
        logSupabaseClientError("createCourseAction:lessons", lessonError, { courseId: course.id });
        return { ok: false, code: "persist_failed" };
      }
    }

    await recordSystemAudit({
      action: "course.create",
      resourceType: "learning_course",
      resourceId: course.id,
      payload: { listed_in_shop: data.listedInShop, progress_mode: data.progressMode },
    });
    revalidateAcademicSurfaces(data.locale);
    revalidatePath(`/${data.locale}/dashboard/admin/academic/contents`);
    revalidatePath(`/${data.locale}/dashboard/student/progress`);
    revalidatePath(`/${data.locale}/tienda`);
    return { ok: true, id: course.id };
  } catch (error) {
    if (error instanceof Error && (error.message === ADMIN_SESSION_UNAUTHORIZED || error.message === ADMIN_SESSION_FORBIDDEN)) {
      logServerAuthzDenied("createCourseAction", { reason: error.message });
      return { ok: false, code: "unauthorized" };
    }
    logServerActionException("createCourseAction", error);
    return { ok: false, code: "persist_failed" };
  }
}
