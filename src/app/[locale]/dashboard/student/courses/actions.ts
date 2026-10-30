"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { loadStudentCourses } from "@/lib/courses/loadStudentCourses";
import { createClient } from "@/lib/supabase/server";
import {
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const CompleteSchema = z.object({
  locale: z.string().min(2).max(8),
  lessonId: z.string().uuid(),
});

export type CompleteCourseLessonResult =
  | { ok: true }
  | { ok: false; code: "unauthorized" | "invalid_input" | "not_found" | "locked" | "persist_failed" };

export async function completeCourseLessonAction(raw: unknown): Promise<CompleteCourseLessonResult> {
  const parsed = CompleteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, code: "unauthorized" };

    const courses = await loadStudentCourses(supabase, user.id);
    const lesson = courses
      .flatMap((course) => course.modules.flatMap((module) => module.lessons))
      .find((row) => row.id === parsed.data.lessonId);
    if (!lesson) return { ok: false, code: "not_found" };
    if (!lesson.unlocked) return { ok: false, code: "locked" };
    if (lesson.completed) return { ok: true };

    const { error } = await supabase.from("course_lesson_progress").insert({
      student_id: user.id,
      lesson_id: parsed.data.lessonId,
    });
    if (error) {
      logSupabaseClientError("completeCourseLessonAction:insert", error, {
        lessonId: parsed.data.lessonId,
      });
      return { ok: false, code: "persist_failed" };
    }

    await recordUserEventServer({
      userId: user.id,
      eventType: "action",
      entity: `material:course-lesson:${parsed.data.lessonId}:complete`,
      metadata: { lesson_id: parsed.data.lessonId },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/student/progress`);
    return { ok: true };
  } catch (error) {
    logServerActionException("completeCourseLessonAction", error);
    return { ok: false, code: "persist_failed" };
  }
}
