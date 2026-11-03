"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { logServerActionException, logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditLearningTaskStaffAction, assertTaskTransition, staffCanManageLearningSection } from "@/lib/learning-tasks";
import { parsePlainText } from "@/lib/learning-tasks/plainText";
import type { LearningTaskActionResult } from "./actionShared";

const ReturnSchema = z.object({
  locale: z.string().min(2).max(8),
  sectionId: z.string().uuid(),
  progressId: z.string().uuid(),
  note: z.string(),
});

export async function returnTaskAction(raw: unknown): Promise<LearningTaskActionResult> {
  const parsed = ReturnSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const note = parsePlainText(parsed.data.note, 4000);
  if (!note.ok) return { ok: false, code: "invalid_input" };

  try {
    const { supabase, user } = await assertTeacher();
    const canManage = await staffCanManageLearningSection(supabase, user.id, parsed.data.sectionId);
    if (!canManage) {
      logServerAuthzDenied("returnTaskAction", { sectionId: parsed.data.sectionId });
      return { ok: false, code: "forbidden" };
    }

    const { data, error } = await supabase
      .from("student_task_progress")
      .select("id, status, task_instances!inner(section_id)")
      .eq("id", parsed.data.progressId)
      .eq("task_instances.section_id", parsed.data.sectionId)
      .maybeSingle();
    if (error || !data) {
      if (error) logSupabaseClientError("returnTaskAction:load", error, { progressId: parsed.data.progressId });
      return { ok: false, code: "not_found" };
    }
    const status = (data as { status: "COMPLETED" | "COMPLETED_LATE" | "OPENED" | "NOT_OPENED" | "RETURNED" }).status;
    assertTaskTransition(status, "RETURNED");

    const { error: reviewError } = await supabase.from("student_task_reviews").insert({
      progress_id: parsed.data.progressId,
      author_id: user.id,
      body_text: note.text,
    });
    if (reviewError) {
      logSupabaseClientError("returnTaskAction:review", reviewError, { progressId: parsed.data.progressId });
      return { ok: false, code: "persist_failed" };
    }
    const { error: updateError } = await supabase
      .from("student_task_progress")
      .update({ status: "RETURNED", completed_at: null })
      .eq("id", parsed.data.progressId)
      .eq("status", status);
    if (updateError) {
      logSupabaseClientError("returnTaskAction:update", updateError, { progressId: parsed.data.progressId });
      return { ok: false, code: "persist_failed" };
    }

    await auditLearningTaskStaffAction({
      actorId: user.id,
      action: "learning_task.returned",
      resourceType: "student_task_progress",
      resourceId: parsed.data.progressId,
      payload: { sectionId: parsed.data.sectionId },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}/tasks`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student/tasks`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student/progress`);
    return { ok: true, id: parsed.data.progressId };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid task")) {
      return { ok: false, code: "invalid_input" };
    }
    logServerActionException("returnTaskAction", error);
    return { ok: false, code: "persist_failed" };
  }
}
