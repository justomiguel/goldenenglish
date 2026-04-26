"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { sanitizeLearningTaskHtml } from "@/lib/learning-tasks/sanitizeLearningTaskHtml";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";

export type ContentActionResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "empty_body" | "persist_failed" | "forbidden" };

const PlanSchema = z.object({
  locale: z.string().min(2).max(8),
  sectionId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  teacherObjectives: z.string().trim().max(12000),
  generalScope: z.string().trim().max(12000),
  evaluationCriteria: z.string().trim().max(12000),
});

const LessonSchema = z.object({
  locale: z.string().min(2).max(8),
  planId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  bodyHtml: z.string().trim().max(80_000).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  lessonKind: z.enum(["lesson", "unit", "review", "exam_prep", "remediation"]).default("lesson"),
});

const QuestionSchema = z.object({
  sectionId: z.string().uuid().optional(),
  prompt: z.string().trim().min(1).max(4000),
  questionType: z.enum(["true_false", "multiple_choice", "short_answer", "rubric", "oral_check"]),
  skill: z.string().trim().max(80).optional(),
  cefrLevel: z.string().trim().max(40).optional(),
});

const AssessmentSchema = z.object({
  sectionId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  assessmentKind: z.enum(["entry", "exit", "formative", "mini_test", "diagnostic"]),
  gradingMode: z.enum(["numeric", "pass_fail", "diagnostic", "rubric", "manual_feedback"]),
  instructions: z.string().trim().max(12000).optional(),
});

export async function saveSectionContentPlanAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = PlanSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const payload = {
      section_id: parsed.data.sectionId,
      title: parsed.data.title,
      teacher_objectives: parsed.data.teacherObjectives,
      general_scope: parsed.data.generalScope,
      evaluation_criteria: parsed.data.evaluationCriteria,
      updated_by: user.id,
    };
    const { data, error } = await supabase
      .from("section_content_plans")
      .upsert({ ...payload, created_by: user.id }, { onConflict: "section_id" })
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.admin_section_plan_saved",
      resourceType: "section_content_plans",
      resourceId: (data as { id: string }).id,
      payload: { sectionId: parsed.data.sectionId },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("saveSectionContentPlanAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function createPlannedLessonAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = LessonSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const safeBody = sanitizeLearningTaskHtml(parsed.data.bodyHtml ?? "");
  try {
    const { supabase, user } = await assertAdmin();
    const { data, error } = await supabase
      .from("planned_lessons")
      .insert({
        section_content_plan_id: parsed.data.planId,
        title: parsed.data.title,
        body_html: safeBody,
        sort_order: parsed.data.sortOrder,
        lesson_kind: parsed.data.lessonKind,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.planned_lesson_created",
      resourceType: "planned_lessons",
      resourceId: (data as { id: string }).id,
      payload: { planId: parsed.data.planId, lessonKind: parsed.data.lessonKind },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("createPlannedLessonAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function createQuestionBankItemAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = QuestionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { data, error } = await supabase
      .from("question_bank_items")
      .insert({
        section_id: parsed.data.sectionId ?? null,
        visibility: parsed.data.sectionId ? "section" : "global",
        question_type: parsed.data.questionType,
        prompt: parsed.data.prompt,
        skill: parsed.data.skill ?? null,
        cefr_level: parsed.data.cefrLevel ?? null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.question_bank_item_created",
      resourceType: "question_bank_items",
      resourceId: (data as { id: string }).id,
      payload: { sectionId: parsed.data.sectionId ?? null, questionType: parsed.data.questionType },
    });
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("createQuestionBankItemAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function createLearningAssessmentAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = AssessmentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { data, error } = await supabase
      .from("learning_assessments")
      .insert({
        section_id: parsed.data.sectionId,
        assessment_kind: parsed.data.assessmentKind,
        grading_mode: parsed.data.gradingMode,
        title: parsed.data.title,
        instructions: parsed.data.instructions ?? "",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.assessment_created",
      resourceType: "learning_assessments",
      resourceId: (data as { id: string }).id,
      payload: {
        sectionId: parsed.data.sectionId,
        assessmentKind: parsed.data.assessmentKind,
        gradingMode: parsed.data.gradingMode,
      },
    });
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("createLearningAssessmentAction", err);
    return { ok: false, code: "forbidden" };
  }
}
