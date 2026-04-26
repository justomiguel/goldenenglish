import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LearningAssessmentModel,
  LearningRouteContentTemplateOption,
  LearningRouteModel,
  LearningRouteStepModel,
  QuestionBankItemModel,
  SectionLearningRouteAssignment,
  SectionContentHealth,
} from "@/types/learningContent";

type RouteRow = {
  id: string;
  title: string;
  teacher_objectives: string;
  general_scope: string;
  evaluation_criteria: string;
  status: "draft" | "active" | "archived";
};

type AssignmentRow = {
  id: string;
  section_id: string;
  learning_route_id: string | null;
  mode: "route" | "free_flow";
  learning_routes?: RouteRow | RouteRow[] | null;
};

function first<T>(raw: T | T[] | null | undefined): T | null {
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
}

export type LearningRouteWorkspace = {
  route: LearningRouteModel | null;
  routeSteps: LearningRouteStepModel[];
  contentTemplates: LearningRouteContentTemplateOption[];
  questions: QuestionBankItemModel[];
  assessments: LearningAssessmentModel[];
  health: SectionContentHealth;
  assignment?: SectionLearningRouteAssignment | null;
};

function mapRoute(row: RouteRow): LearningRouteModel {
  return {
    id: row.id,
    title: row.title,
    teacherObjectives: row.teacher_objectives,
    generalScope: row.general_scope,
    evaluationCriteria: row.evaluation_criteria,
    status: row.status,
  };
}

export async function loadGlobalLearningRouteOptions(
  supabase: SupabaseClient,
): Promise<LearningRouteContentTemplateOption[]> {
  const { data } = await supabase
    .from("learning_routes")
    .select("id, title, general_scope")
    .order("updated_at", { ascending: false })
    .limit(200);

  return ((data ?? []) as { id: string; title: string; general_scope: string }[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.general_scope,
  }));
}

export async function loadLearningRouteWorkspace(
  supabase: SupabaseClient,
  routeId: string | null = null,
): Promise<LearningRouteWorkspace> {
  const routeQuery = supabase
    .from("learning_routes")
    .select("id, title, teacher_objectives, general_scope, evaluation_criteria, status")
    .order("updated_at", { ascending: false })
    .limit(1);

  const { data: routeData } = routeId ? await routeQuery.eq("id", routeId) : await routeQuery;
  const routeRow = ((routeData ?? []) as RouteRow[])[0] ?? null;
  const route = routeRow ? mapRoute(routeRow) : null;
  return buildLearningRouteWorkspace(supabase, route, null);
}

export async function loadNewLearningRouteWorkspace(
  supabase: SupabaseClient,
): Promise<LearningRouteWorkspace> {
  return buildLearningRouteWorkspace(supabase, null, null);
}

export async function loadSectionLearningRouteWorkspace(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<LearningRouteWorkspace> {
  const { data: assignmentData } = await supabase
    .from("section_learning_routes")
    .select("id, section_id, learning_route_id, mode, learning_routes(id, title, teacher_objectives, general_scope, evaluation_criteria, status)")
    .eq("section_id", sectionId)
    .maybeSingle();
  const assignmentRow = assignmentData as AssignmentRow | null;
  const routeRow = first(assignmentRow?.learning_routes);
  const route = assignmentRow?.mode === "route" && routeRow ? mapRoute(routeRow) : null;
  const assignment = assignmentRow
    ? {
        id: assignmentRow.id,
        sectionId: assignmentRow.section_id,
        learningRouteId: assignmentRow.learning_route_id,
        mode: assignmentRow.mode,
      }
    : null;
  return buildLearningRouteWorkspace(supabase, route, sectionId, assignment);
}

async function buildLearningRouteWorkspace(
  supabase: SupabaseClient,
  route: LearningRouteModel | null,
  sectionId: string | null,
  assignment: SectionLearningRouteAssignment | null = null,
): Promise<LearningRouteWorkspace> {
  const [steps, templates, questions, assessments, readiness] = await Promise.all([
    route?.id
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
      missingObjectives: route
        ? !route.teacherObjectives.trim() || !route.generalScope.trim() || !route.evaluationCriteria.trim()
        : true,
      missingEntryAssessment: sectionId ? !assessmentRows.some((row) => row.assessment_kind === "entry") : false,
      missingExitAssessment: sectionId ? !assessmentRows.some((row) => row.assessment_kind === "exit") : false,
      needsSupportCount: readinessRows.filter((row) => row.readiness_status === "needs_support").length,
      teacherOverrideCount: readinessRows.filter((row) => row.readiness_status === "teacher_override").length,
    },
    assignment,
  };
}
