"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { loadStudentCourses } from "@/lib/courses/loadStudentCourses";
import { courseFinishedAfterLesson } from "@/lib/courses/courseCompletion";
import { syncCourseCompletion } from "@/lib/courses/syncCourseCompletion";
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
    const course = courses.find((row) => row.modules.some((module) => module.lessons.some((item) => item.id === parsed.data.lessonId)));
    const lesson = course?.modules.flatMap((module) => module.lessons).find((row) => row.id === parsed.data.lessonId);
    if (!course || !lesson) return { ok: false, code: "not_found" };
    if (!lesson.unlocked) return { ok: false, code: "locked" };
    const finished = courseFinishedAfterLesson(
      course.modules.flatMap((module) => module.lessons),
      lesson.id,
    );
    if (lesson.completed) {
      await syncCourseCompletion({ studentId: user.id, courseId: course.id, finished });
      return { ok: true };
    }

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
    await syncCourseCompletion({ studentId: user.id, courseId: course.id, finished });
    revalidatePath(`/${parsed.data.locale}/dashboard/student/progress`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student/courses/${course.id}/certificate`);
    return { ok: true };
  } catch (error) {
    logServerActionException("completeCourseLessonAction", error);
    return { ok: false, code: "persist_failed" };
  }
}
