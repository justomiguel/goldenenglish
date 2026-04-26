import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LearningAssessmentModel,
  PlannedLessonModel,
  QuestionBankItemModel,
  SectionContentHealth,
  SectionContentPlanModel,
} from "@/types/learningContent";

type PlanRow = {
  id: string;
  section_id: string;
  title: string;
  teacher_objectives: string;
  general_scope: string;
  evaluation_criteria: string;
  status: "draft" | "active" | "archived";
};

export type SectionContentWorkspace = {
  plan: SectionContentPlanModel;
  plannedLessons: PlannedLessonModel[];
  questions: QuestionBankItemModel[];
  assessments: LearningAssessmentModel[];
  health: SectionContentHealth;
};

function emptyPlan(sectionId: string): SectionContentPlanModel {
  return {
    id: null,
    sectionId,
    title: "",
    teacherObjectives: "",
    generalScope: "",
    evaluationCriteria: "",
    status: "draft",
  };
}

export async function loadSectionContentWorkspace(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionContentWorkspace> {
  const { data: planData } = await supabase
    .from("section_content_plans")
    .select("id, section_id, title, teacher_objectives, general_scope, evaluation_criteria, status")
    .eq("section_id", sectionId)
    .maybeSingle();

  const planRow = planData as PlanRow | null;
  const plan = planRow
    ? {
        id: planRow.id,
        sectionId: planRow.section_id,
        title: planRow.title,
        teacherObjectives: planRow.teacher_objectives,
        generalScope: planRow.general_scope,
        evaluationCriteria: planRow.evaluation_criteria,
        status: planRow.status,
      }
    : emptyPlan(sectionId);

  const [lessons, questions, assessments, readiness] = await Promise.all([
    plan.id
      ? supabase
          .from("planned_lessons")
          .select("id, title, sort_order, lesson_kind, is_required")
          .eq("section_content_plan_id", plan.id)
          .order("sort_order", { ascending: true })
          .limit(80)
      : Promise.resolve({ data: [] }),
    supabase
      .from("question_bank_items")
      .select("id, prompt, question_type, skill, cefr_level")
      .or(`visibility.eq.global,section_id.eq.${sectionId}`)
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase
      .from("learning_assessments")
      .select("id, title, assessment_kind, grading_mode")
      .eq("section_id", sectionId)
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("student_learning_readiness")
      .select("readiness_status")
      .eq("section_id", sectionId)
      .limit(200),
  ]);

  const assessmentRows = ((assessments.data ?? []) as {
    id: string;
    title: string;
    assessment_kind: string;
    grading_mode: LearningAssessmentModel["gradingMode"];
  }[]);
  const readinessRows = (readiness.data ?? []) as { readiness_status: string }[];

  return {
    plan,
    plannedLessons: ((lessons.data ?? []) as {
      id: string;
      title: string;
      sort_order: number;
      lesson_kind: string;
      is_required: boolean;
    }[]).map((row) => ({
      id: row.id,
      title: row.title,
      sortOrder: row.sort_order,
      lessonKind: row.lesson_kind,
      isRequired: row.is_required,
    })),
    questions: ((questions.data ?? []) as {
      id: string;
      prompt: string;
      question_type: string;
      skill: string | null;
      cefr_level: string | null;
    }[]).map((row) => ({
      id: row.id,
      prompt: row.prompt,
      questionType: row.question_type,
      skill: row.skill,
      cefrLevel: row.cefr_level,
    })),
    assessments: assessmentRows.map((row) => ({
      id: row.id,
      title: row.title,
      assessmentKind: row.assessment_kind,
      gradingMode: row.grading_mode,
    })),
    health: {
      missingObjectives: !plan.teacherObjectives.trim() || !plan.generalScope.trim() || !plan.evaluationCriteria.trim(),
      missingEntryAssessment: !assessmentRows.some((row) => row.assessment_kind === "entry"),
      missingExitAssessment: !assessmentRows.some((row) => row.assessment_kind === "exit"),
      needsSupportCount: readinessRows.filter((row) => row.readiness_status === "needs_support").length,
      teacherOverrideCount: readinessRows.filter((row) => row.readiness_status === "teacher_override").length,
    },
  };
}
