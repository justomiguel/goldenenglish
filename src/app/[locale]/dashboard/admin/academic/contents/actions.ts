"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";

export type ContentActionResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "empty_body" | "persist_failed" | "forbidden" };

const LearningRouteSchema = z.object({
  locale: z.string().min(2).max(8),
  routeId: z.string().uuid().nullable().optional(),
  sectionId: z.string().uuid().nullable(),
  visibility: z.enum(["global", "section"]),
  title: z.string().trim().min(1).max(180),
  teacherObjectives: z.string().trim().max(12000),
  generalScope: z.string().trim().max(12000),
  evaluationCriteria: z.string().trim().max(12000),
}).refine((value) => (
  (value.visibility === "global" && value.sectionId === null)
  || (value.visibility === "section" && value.sectionId !== null)
), { path: ["sectionId"] });

const RouteStepSchema = z.object({
  locale: z.string().min(2).max(8),
  routeId: z.string().uuid(),
  contentTemplateId: z.string().uuid(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  stepKind: z.enum(["lesson", "unit", "review", "exam_prep", "remediation"]).default("lesson"),
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

export async function saveLearningRouteAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = LearningRouteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const payload = {
      section_id: parsed.data.sectionId,
      visibility: parsed.data.visibility,
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
      action: "learning_content.admin_learning_route_saved",
      resourceType: "learning_routes",
      resourceId: (data as { id: string }).id,
      payload: { sectionId: parsed.data.sectionId, visibility: parsed.data.visibility },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents/sections/${parsed.data.sectionId ?? "global"}/edit`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("saveLearningRouteAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function addLearningRouteStepAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = RouteStepSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { data: template, error: templateError } = await supabase
      .from("content_templates")
      .select("id, title, body_html")
      .eq("id", parsed.data.contentTemplateId)
      .is("archived_at", null)
      .maybeSingle();
    if (templateError || !template) return { ok: false, code: "invalid_input" };
    const { data, error } = await supabase
      .from("learning_route_steps")
      .insert({
        learning_route_id: parsed.data.routeId,
        content_template_id: parsed.data.contentTemplateId,
        title: (template as { title: string }).title,
        body_html: (template as { body_html: string }).body_html,
        sort_order: parsed.data.sortOrder,
        lesson_kind: parsed.data.stepKind,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.learning_route_step_created",
      resourceType: "learning_route_steps",
      resourceId: (data as { id: string }).id,
      payload: {
        learningRouteId: parsed.data.routeId,
        contentTemplateId: parsed.data.contentTemplateId,
        stepKind: parsed.data.stepKind,
      },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("addLearningRouteStepAction", err);
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
