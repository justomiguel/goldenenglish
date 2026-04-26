import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LearningAssessmentModel,
  LearningRouteContentTemplateOption,
  LearningRouteModel,
  LearningRouteStepModel,
  QuestionBankItemModel,
  SectionContentHealth,
} from "@/types/learningContent";

type RouteRow = {
  id: string;
  section_id: string | null;
  visibility: "global" | "section";
  title: string;
  teacher_objectives: string;
  general_scope: string;
  evaluation_criteria: string;
  status: "draft" | "active" | "archived";
};

function first<T>(raw: T | T[] | null | undefined): T | null {
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
}

export type LearningRouteWorkspace = {
  route: LearningRouteModel;
  routeSteps: LearningRouteStepModel[];
  contentTemplates: LearningRouteContentTemplateOption[];
  questions: QuestionBankItemModel[];
  assessments: LearningAssessmentModel[];
  health: SectionContentHealth;
};

function emptyRoute(sectionId: string | null): LearningRouteModel {
  return {
    id: null,
    sectionId,
    visibility: sectionId ? "section" : "global",
    title: "",
    teacherObjectives: "",
    generalScope: "",
    evaluationCriteria: "",
    status: "draft",
  };
}

export async function loadLearningRouteWorkspace(
  supabase: SupabaseClient,
  sectionId: string | null,
): Promise<LearningRouteWorkspace> {
  const routeQuery = supabase
    .from("learning_routes")
    .select("id, section_id, visibility, title, teacher_objectives, general_scope, evaluation_criteria, status")
    .order("updated_at", { ascending: false })
    .limit(1);

  const { data: routeData } = sectionId
    ? await routeQuery.eq("section_id", sectionId).eq("visibility", "section")
    : await routeQuery.is("section_id", null).eq("visibility", "global");

  const routeRow = ((routeData ?? []) as RouteRow[])[0] ?? null;
  const route = routeRow
    ? {
        id: routeRow.id,
        sectionId: routeRow.section_id,
        visibility: routeRow.visibility,
        title: routeRow.title,
        teacherObjectives: routeRow.teacher_objectives,
        generalScope: routeRow.general_scope,
        evaluationCriteria: routeRow.evaluation_criteria,
        status: routeRow.status,
      }
    : emptyRoute(sectionId);

  const [steps, templates, questions, assessments, readiness] = await Promise.all([
    route.id
      ? supabase
          .from("learning_route_steps")
          .select("id, content_template_id, title, sort_order, lesson_kind, is_required, content_templates(title)")
          .eq("learning_route_id", route.id)
          .order("sort_order", { ascending: true })
          .limit(80)
      : Promise.resolve({ data: [] }),
    supabase
      .from("content_templates")
      .select("id, title, description")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    sectionId
      ? supabase
          .from("question_bank_items")
          .select("id, prompt, question_type, skill, cefr_level")
          .or(`visibility.eq.global,section_id.eq.${sectionId}`)
          .order("updated_at", { ascending: false })
          .limit(80)
      : supabase
          .from("question_bank_items")
          .select("id, prompt, question_type, skill, cefr_level")
          .eq("visibility", "global")
          .order("updated_at", { ascending: false })
          .limit(80),
    sectionId
      ? supabase
          .from("learning_assessments")
          .select("id, title, assessment_kind, grading_mode")
          .eq("section_id", sectionId)
          .order("updated_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] }),
    sectionId
      ? supabase
          .from("student_learning_readiness")
          .select("readiness_status")
          .eq("section_id", sectionId)
          .limit(200)
      : Promise.resolve({ data: [] }),
  ]);

  const assessmentRows = ((assessments.data ?? []) as {
    id: string;
    title: string;
    assessment_kind: string;
    grading_mode: LearningAssessmentModel["gradingMode"];
  }[]);
  const readinessRows = (readiness.data ?? []) as { readiness_status: string }[];

  return {
    route,
    routeSteps: ((steps.data ?? []) as {
      id: string;
      content_template_id: string;
      title: string;
      sort_order: number;
      lesson_kind: string;
      is_required: boolean;
      content_templates?: { title: string } | { title: string }[] | null;
    }[]).map((row) => ({
      id: row.id,
      contentTemplateId: row.content_template_id,
      contentTitle: first(row.content_templates)?.title ?? row.title,
      title: row.title,
      sortOrder: row.sort_order,
      stepKind: row.lesson_kind,
      isRequired: row.is_required,
    })),
    contentTemplates: ((templates.data ?? []) as LearningRouteContentTemplateOption[]).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
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
      missingObjectives: !route.teacherObjectives.trim() || !route.generalScope.trim() || !route.evaluationCriteria.trim(),
      missingEntryAssessment: sectionId ? !assessmentRows.some((row) => row.assessment_kind === "entry") : false,
      missingExitAssessment: sectionId ? !assessmentRows.some((row) => row.assessment_kind === "exit") : false,
      needsSupportCount: readinessRows.filter((row) => row.readiness_status === "needs_support").length,
      teacherOverrideCount: readinessRows.filter((row) => row.readiness_status === "teacher_override").length,
    },
  };
}
