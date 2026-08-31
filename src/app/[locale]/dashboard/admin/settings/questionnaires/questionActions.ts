"use server";

import { revalidatePath } from "next/cache";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { loadAdminQuestionnaireDetail } from "@/lib/questionnaires/loadAdminQuestionnaires";
import { canMutateQuestionShape, optionsEqual } from "@/lib/questionnaires/canMutateQuestionShape";
import { pickI18n, pickI18nOptions } from "@/lib/questionnaires/pickI18n";
import {
  MAX_OPTIONS_PER_QUESTION,
  MAX_QUESTIONS_PER_QUESTIONNAIRE,
  QUESTIONNAIRE_QUESTION_TYPES,
  type QuestionnaireQuestionType,
} from "@/lib/questionnaires/types";

function revalidateEditor(locale: string, id: string) {
  revalidatePath(`/${locale}/dashboard/admin/settings/questionnaires/${id}`);
}

function sanitizeOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter(Boolean).slice(0, MAX_OPTIONS_PER_QUESTION);
}

export async function addQuestionnaireQuestionAction(input: {
  locale: string;
  questionnaireId: string;
  questionType: QuestionnaireQuestionType;
  prompt: string;
  required: boolean;
  options: string[];
}): Promise<{ ok: true } | { ok: false; code: string }> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    logServerAuthzDenied("addQuestionnaireQuestionAction");
    return { ok: false, code: "save" };
  }
  if (!QUESTIONNAIRE_QUESTION_TYPES.includes(input.questionType)) {
    return { ok: false, code: "save" };
  }
  const prompt = input.prompt.trim();
  if (!prompt) return { ok: false, code: "title" };
  const detail = await loadAdminQuestionnaireDetail(session.supabase, input.questionnaireId);
  if (!detail) return { ok: false, code: "save" };
  const active = detail.questions.filter((q) => !q.archivedAt);
  if (active.length >= MAX_QUESTIONS_PER_QUESTIONNAIRE) return { ok: false, code: "cap" };
  const needsOptions = input.questionType === "single_choice" || input.questionType === "multi_choice";
  const options = needsOptions ? sanitizeOptions(input.options) : [];
  if (needsOptions && options.length < 2) return { ok: false, code: "publish_options" };
  const nextPosition = detail.questions.reduce((max, q) => Math.max(max, q.position), -1) + 1;
  const { error } = await session.supabase.from("questionnaire_questions").insert({
    questionnaire_id: input.questionnaireId,
    question_type: input.questionType,
    prompt_i18n: { [defaultLocale]: prompt },
    options_i18n: needsOptions ? { [defaultLocale]: options } : {},
    required: input.required,
    position: nextPosition,
  });
  if (error) {
    logSupabaseClientError("addQuestionnaireQuestionAction", error, { id: input.questionnaireId });
    return { ok: false, code: "save" };
  }
  void recordSystemAudit({
    action: "questionnaire_question_created",
    resourceType: "questionnaire_question",
    resourceId: input.questionnaireId,
  });
  revalidateEditor(input.locale, input.questionnaireId);
  return { ok: true };
}

export async function archiveQuestionnaireQuestionAction(
  locale: string,
  questionId: string,
  questionnaireId: string,
): Promise<{ ok: boolean }> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    logServerAuthzDenied("archiveQuestionnaireQuestionAction");
    return { ok: false };
  }
  const { error } = await session.supabase
    .from("questionnaire_questions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", questionId);
  if (error) {
    logSupabaseClientError("archiveQuestionnaireQuestionAction", error, { questionId });
    return { ok: false };
  }
  revalidateEditor(locale, questionnaireId);
  return { ok: true };
}

export async function reorderQuestionnaireQuestionAction(input: {
  locale: string;
  questionnaireId: string;
  questionId: string;
  direction: "up" | "down";
}): Promise<{ ok: boolean }> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    logServerAuthzDenied("reorderQuestionnaireQuestionAction");
    return { ok: false };
  }
  const detail = await loadAdminQuestionnaireDetail(session.supabase, input.questionnaireId);
  if (!detail) return { ok: false };
  const active = detail.questions.filter((q) => !q.archivedAt);
  const index = active.findIndex((q) => q.id === input.questionId);
  const swapWith = input.direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= active.length) return { ok: false };
  const a = active[index]!;
  const b = active[swapWith]!;
  await session.supabase.from("questionnaire_questions").update({ position: b.position }).eq("id", a.id);
  await session.supabase.from("questionnaire_questions").update({ position: a.position }).eq("id", b.id);
  revalidateEditor(input.locale, input.questionnaireId);
  return { ok: true };
}

export async function updateQuestionnaireQuestionAction(input: {
  locale: string;
  questionnaireId: string;
  questionId: string;
  questionType: QuestionnaireQuestionType;
  prompt: string;
  required: boolean;
  options: string[];
}): Promise<{ ok: true } | { ok: false; code: string }> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    logServerAuthzDenied("updateQuestionnaireQuestionAction");
    return { ok: false, code: "save" };
  }
  const prompt = input.prompt.trim();
  if (!prompt) return { ok: false, code: "title" };
  const detail = await loadAdminQuestionnaireDetail(session.supabase, input.questionnaireId);
  const question = detail?.questions.find((q) => q.id === input.questionId);
  if (!question) return { ok: false, code: "save" };
  const needsOptions = input.questionType === "single_choice" || input.questionType === "multi_choice";
  const options = needsOptions ? sanitizeOptions(input.options) : [];
  if (needsOptions && options.length < 2) return { ok: false, code: "publish_options" };
  const { count } = await session.supabase
    .from("questionnaire_answers")
    .select("id", { count: "exact", head: true })
    .eq("question_id", input.questionId);
  const currentOptions = pickI18nOptions(question.optionsI18n, defaultLocale);
  const gate = canMutateQuestionShape({
    hasAnswers: (count ?? 0) > 0,
    typeChanged: input.questionType !== question.questionType,
    optionsChanged: !optionsEqual(currentOptions, options),
  });
  if (!gate.ok) return { ok: false, code: gate.code };
  const { error } = await session.supabase
    .from("questionnaire_questions")
    .update({
      question_type: input.questionType,
      prompt_i18n: { ...question.promptI18n, [defaultLocale]: prompt },
      options_i18n: needsOptions ? { ...question.optionsI18n, [defaultLocale]: options } : {},
      required: input.required,
    })
    .eq("id", input.questionId);
  if (error) {
    logSupabaseClientError("updateQuestionnaireQuestionAction", error, { id: input.questionId });
    return { ok: false, code: "save" };
  }
  void recordSystemAudit({
    action: "questionnaire_question_updated",
    resourceType: "questionnaire_question",
    resourceId: input.questionId,
    payload: { prompt: pickI18n(question.promptI18n, defaultLocale) },
  });
  revalidateEditor(input.locale, input.questionnaireId);
  return { ok: true };
}
