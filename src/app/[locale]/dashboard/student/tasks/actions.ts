"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { createClient } from "@/lib/supabase/server";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { awardStudentBadges } from "@/lib/badges/awardStudentBadges";
import {
  InvalidStateTransitionException,
  assertTaskTransition,
  resolveCompletionStatus,
  type TaskProgressStatus,
} from "@/lib/learning-tasks";

export type StudentTaskActionResult =
  | { ok: true; status: TaskProgressStatus }
  | { ok: false; code: "unauthorized" | "invalid_input" | "not_found" | "invalid_transition" | "persist_failed" };

const TaskSchema = z.object({
  locale: z.string().min(2).max(8),
  taskInstanceId: z.string().uuid(),
});

type ProgressRow = {
  id: string;
  status: TaskProgressStatus;
  task_instances: { id: string; start_at: string; due_at: string } | { id: string; start_at: string; due_at: string }[] | null;
};

function taskRow(row: ProgressRow): { id: string; start_at: string; due_at: string } | null {
  const raw = row.task_instances;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

async function loadProgress(taskInstanceId: string, userId: string): Promise<ProgressRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_task_progress")
    .select("id, status, task_instances(id, start_at, due_at)")
    .eq("task_instance_id", taskInstanceId)
    .eq("student_id", userId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("studentTaskActions:loadProgress", error, { taskInstanceId });
    return null;
  }
  return (data as ProgressRow | null) ?? null;
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function markTaskOpenedAfterEngagementAction(
  raw: unknown,
): Promise<StudentTaskActionResult> {
  const parsed = TaskSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const userId = await currentUserId();
  if (!userId) return { ok: false, code: "unauthorized" };

  try {
    const progress = await loadProgress(parsed.data.taskInstanceId, userId);
    if (!progress) return { ok: false, code: "not_found" };
    if (progress.status !== "NOT_OPENED") return { ok: true, status: progress.status };

    const task = taskRow(progress);
    if (!task || Date.now() < new Date(task.start_at).getTime()) {
      return { ok: false, code: "not_found" };
    }
    assertTaskTransition(progress.status, "OPENED");

    const supabase = await createClient();
    const openedAt = new Date().toISOString();
    const { error } = await supabase
      .from("student_task_progress")
      .update({ status: "OPENED", opened_at: openedAt })
      .eq("id", progress.id)
      .eq("status", "NOT_OPENED");
    if (error) return { ok: false, code: "persist_failed" };

    await recordUserEventServer({
      userId,
      eventType: "page_view",
      entity: `material:task:${task.id}`,
      metadata: { task_instance_id: task.id, engagement_seconds: 5 },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/student/tasks`);
    return { ok: true, status: "OPENED" };
  } catch (err) {
    logServerException("markTaskOpenedAfterEngagementAction", err);
    return { ok: false, code: "persist_failed" };
  }
}

export async function completeTaskAction(raw: unknown): Promise<StudentTaskActionResult> {
  const parsed = TaskSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const userId = await currentUserId();
  if (!userId) return { ok: false, code: "unauthorized" };

  try {
    const progress = await loadProgress(parsed.data.taskInstanceId, userId);
    if (!progress) return { ok: false, code: "not_found" };
    const task = taskRow(progress);
    if (!task) return { ok: false, code: "not_found" };
    const completedAt = new Date();
    const nextStatus = resolveCompletionStatus({
      currentStatus: progress.status,
      dueAt: task.due_at,
      completedAt,
    });

    const supabase = await createClient();
    const { error } = await supabase
      .from("student_task_progress")
      .update({ status: nextStatus, completed_at: completedAt.toISOString() })
      .eq("id", progress.id)
      .eq("status", progress.status);
    if (error) return { ok: false, code: "persist_failed" };

    await recordUserEventServer({
      userId,
      eventType: "action",
      entity: `material:task:${task.id}:complete`,
      metadata: { task_instance_id: task.id, status: nextStatus },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/student/tasks`);
    await awardStudentBadges({ studentId: userId, locale: parsed.data.locale });
    return { ok: true, status: nextStatus };
  } catch (err) {
    if (err instanceof InvalidStateTransitionException) {
      return { ok: false, code: "invalid_transition" };
    }
    logServerException("completeTaskAction", err);
    return { ok: false, code: "persist_failed" };
  }
}
