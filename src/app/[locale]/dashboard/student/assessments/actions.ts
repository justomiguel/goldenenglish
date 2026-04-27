"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { evaluateTrueFalseMiniTest } from "@/lib/learning-content";
import { logServerException } from "@/lib/logging/serverActionLog";
import { awardStudentBadges } from "@/lib/badges/awardStudentBadges";

type SubmitMiniTestResult =
  | { ok: true; id: string; score: number; passed: boolean }
  | { ok: false; code: "invalid_input" | "unauthorized" | "forbidden" | "not_found" | "persist_failed" };

const SubmitMiniTestSchema = z.object({
  locale: z.string().min(2).max(8),
  assessmentId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.boolean(),
  })).min(1).max(50),
});

type AssessmentRow = {
  id: string;
  section_id: string | null;
  grading_mode: "numeric" | "pass_fail" | "diagnostic" | "rubric" | "manual_feedback";
  passing_score: number | null;
  required_for_completion: boolean;
};

export async function submitStudentMiniTestAction(raw: unknown): Promise<SubmitMiniTestResult> {
  const parsed = SubmitMiniTestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, code: "unauthorized" };

    const { data: assessmentData } = await supabase
      .from("learning_assessments")
      .select("id, section_id, grading_mode, passing_score, required_for_completion")
      .eq("id", parsed.data.assessmentId)
      .maybeSingle();
    const assessment = assessmentData as AssessmentRow | null;
    if (!assessment?.section_id) return { ok: false, code: "not_found" };

    const { data: enrollment } = await supabase
      .from("section_enrollments")
      .select("id")
      .eq("section_id", assessment.section_id)
      .eq("student_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!enrollment) return { ok: false, code: "forbidden" };

    const { data: links } = await supabase
      .from("learning_assessment_questions")
      .select("question_id, points, question_bank_items(id, prompt, question_type, options, correct_answer)")
      .eq("assessment_id", parsed.data.assessmentId)
      .order("sort_order", { ascending: true })
      .limit(50);
    const questions = ((links ?? []) as {
      points: number | null;
      question_bank_items: {
        id: string;
        prompt: string;
        question_type: "true_false";
        options: unknown;
        correct_answer: unknown;
      } | {
        id: string;
        prompt: string;
        question_type: "true_false";
        options: unknown;
        correct_answer: unknown;
      }[] | null;
    }[]).flatMap((link) => {
      const question = Array.isArray(link.question_bank_items)
        ? link.question_bank_items[0]
        : link.question_bank_items;
      return question ? [{ ...question, questionType: question.question_type, questionTypeRaw: question.question_type, points: link.points }] : [];
    });
    if (questions.length === 0) return { ok: false, code: "not_found" };

    const outcome = evaluateTrueFalseMiniTest({
      passingScore: assessment.passing_score,
      questions: questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        questionType: question.questionTypeRaw,
        options: question.options,
        correctAnswer: question.correct_answer,
        points: question.points,
      })),
      answers: parsed.data.answers,
    });
    const { count } = await supabase
      .from("student_assessment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("assessment_id", parsed.data.assessmentId)
      .eq("student_id", user.id);
    const { data: inserted, error } = await supabase
      .from("student_assessment_attempts")
      .insert({
        assessment_id: parsed.data.assessmentId,
        student_id: user.id,
        enrollment_id: (enrollment as { id: string }).id,
        attempt_no: (count ?? 0) + 1,
        status: "submitted",
        answers: Object.fromEntries(parsed.data.answers.map((answer) => [answer.questionId, answer.answer])),
        question_snapshots: outcome.questionSnapshots,
        score: outcome.score,
        passed: outcome.passed,
      })
      .select("id")
      .single();
    if (error || !inserted) return { ok: false, code: "persist_failed" };
    revalidatePath(`/${parsed.data.locale}/dashboard/student/assessments`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student`);
    await awardStudentBadges({ studentId: user.id, locale: parsed.data.locale });
    return { ok: true, id: (inserted as { id: string }).id, score: outcome.score, passed: outcome.passed };
  } catch (err) {
    logServerException("submitStudentMiniTestAction", err);
    return { ok: false, code: "persist_failed" };
  }
}
