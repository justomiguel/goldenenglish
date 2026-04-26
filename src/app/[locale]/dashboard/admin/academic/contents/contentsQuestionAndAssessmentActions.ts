"use server";

import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";
import { AssessmentSchema, QuestionSchema } from "@/lib/learning-content/contentsActionsSchemas";
import type { ContentActionResult } from "@/app/[locale]/dashboard/admin/academic/contents/contentsActionShared";

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
