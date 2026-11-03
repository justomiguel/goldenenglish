import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { nextCompletionWrite } from "@/lib/courses/courseCompletion";

export async function syncCourseCompletion(input: {
  studentId: string;
  courseId: string;
  finished: boolean;
}): Promise<void> {
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("student_course_completions")
    .select("id, revoked_at")
    .eq("student_id", input.studentId)
    .eq("course_id", input.courseId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("syncCourseCompletion:read", error, { courseId: input.courseId });
    return;
  }
  const existing = data ? { revokedAt: (data as { revoked_at: string | null }).revoked_at } : null;
  const action = nextCompletionWrite({ finished: input.finished, existing });
  if (action === "none") return;

  if (action === "insert") {
    const { error: insertError } = await admin.from("student_course_completions").insert({
      student_id: input.studentId,
      course_id: input.courseId,
    });
    if (insertError) logSupabaseClientError("syncCourseCompletion:insert", insertError, { courseId: input.courseId });
    return;
  }

  const id = (data as { id: string }).id;
  const patch = action === "revoke" ? { revoked_at: new Date().toISOString() } : { revoked_at: null };
  const { error: updateError } = await admin.from("student_course_completions").update(patch).eq("id", id);
  if (updateError) logSupabaseClientError("syncCourseCompletion:update", updateError, { courseId: input.courseId });
}
