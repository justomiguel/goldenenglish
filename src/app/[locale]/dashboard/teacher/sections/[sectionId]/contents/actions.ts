"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { logServerException } from "@/lib/logging/serverActionLog";
import { staffCanManageLearningSection } from "@/lib/learning-tasks/staffAccess";
import { resolveReadinessDecision } from "@/lib/learning-content";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";

type TeacherContentActionResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "forbidden" | "persist_failed" };

const LiveLessonSchema = z.object({
  locale: z.string().min(2).max(8),
  sectionId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  summary: z.string().trim().max(12000).optional(),
  routeStepIds: z.array(z.string().uuid()).max(6).default([]),
});

const LearningRouteSchema = z.object({
  locale: z.string().min(2).max(8),
  routeId: z.string().uuid().nullable().optional(),
  sectionId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  teacherObjectives: z.string().trim().max(12000),
  generalScope: z.string().trim().max(12000),
  evaluationCriteria: z.string().trim().max(12000),
});

const ReadinessSchema = z.object({
  locale: z.string().min(2).max(8),
  sectionId: z.string().uuid(),
  studentId: z.string().uuid(),
  teacherApproved: z.boolean(),
  failedAttempt: z.boolean().default(false),
  reason: z.string().trim().max(4000).optional(),
});

async function assertCanManage(sectionId: string) {
  const ctx = await assertTeacher();
  const allowed = await staffCanManageLearningSection(ctx.supabase, ctx.user.id, sectionId);
  if (!allowed) throw new Error("forbidden");
  return ctx;
}

export async function createLiveLessonAction(raw: unknown): Promise<TeacherContentActionResult> {
  const parsed = LiveLessonSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertCanManage(parsed.data.sectionId);
    const coverageStatus =
      parsed.data.routeStepIds.length > 1
        ? "merged"
        : parsed.data.routeStepIds.length === 1
          ? "as_planned"
          : "extra";
    const { data, error } = await supabase
      .from("live_lessons")
      .insert({
        section_id: parsed.data.sectionId,
        title: parsed.data.title,
        summary: parsed.data.summary ?? "",
        coverage_status: coverageStatus,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    const liveLessonId = (data as { id: string }).id;
    if (parsed.data.routeStepIds.length > 0) {
      const { error: linkError } = await supabase.from("live_lesson_route_step_links").insert(
        parsed.data.routeStepIds.map((routeStepId) => ({
          live_lesson_id: liveLessonId,
          learning_route_step_id: routeStepId,
        })),
      );
      if (linkError) return { ok: false, code: "persist_failed" };
    }
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.live_lesson_created",
      resourceType: "live_lessons",
      resourceId: liveLessonId,
      payload: {
        sectionId: parsed.data.sectionId,
        routeStepCount: parsed.data.routeStepIds.length,
        coverageStatus,
      },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}/contents`);
    return { ok: true, id: liveLessonId };
  } catch (err) {
    logServerException("createLiveLessonAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function saveTeacherLearningRouteAction(raw: unknown): Promise<TeacherContentActionResult> {
  const parsed = LearningRouteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertCanManage(parsed.data.sectionId);
    const payload = {
      section_id: parsed.data.sectionId,
      visibility: "section",
      title: parsed.data.title,
      teacher_objectives: parsed.data.teacherObjectives,
      general_scope: parsed.data.generalScope,
      evaluation_criteria: parsed.data.evaluationCriteria,
      updated_by: user.id,
    };
    const query = parsed.data.routeId
      ? supabase.from("learning_routes").update(payload).eq("id", parsed.data.routeId)
      : supabase.from("learning_routes").insert({ ...payload, created_by: user.id });
    const { data, error } = await query
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.learning_route_saved",
      resourceType: "learning_routes",
      resourceId: (data as { id: string }).id,
      payload: { sectionId: parsed.data.sectionId },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}/contents`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("saveTeacherLearningRouteAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function setStudentReadinessAction(raw: unknown): Promise<TeacherContentActionResult> {
  const parsed = ReadinessSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertCanManage(parsed.data.sectionId);
    const readinessStatus = resolveReadinessDecision({
      teacherApproved: parsed.data.teacherApproved,
      failedAttempt: parsed.data.failedAttempt,
    });
    const { data, error } = await supabase
      .from("student_learning_readiness")
      .upsert(
        {
          student_id: parsed.data.studentId,
          section_id: parsed.data.sectionId,
          readiness_status: readinessStatus,
          reason: parsed.data.reason ?? "",
          set_by: user.id,
        },
        { onConflict: "student_id,section_id" },
      )
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.readiness_set",
      resourceType: "student_learning_readiness",
      resourceId: (data as { id: string }).id,
      payload: {
        sectionId: parsed.data.sectionId,
        studentId: parsed.data.studentId,
        readinessStatus,
      },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}/contents`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("setStudentReadinessAction", err);
    return { ok: false, code: "forbidden" };
  }
}
