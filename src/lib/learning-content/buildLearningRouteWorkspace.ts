import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LearningAssessmentModel,
  LearningRouteContentTemplateOption,
  LearningRouteModel,
  SectionLearningRouteAssignment,
  SectionContentHealth,
} from "@/types/learningContent";
import type { LearningRouteWorkspace } from "@/lib/learning-content/learningRouteWorkspaceModel";
import { firstRelation } from "@/lib/learning-content/learningRouteWorkspaceMapping";

async function loadRouteEdgeIds(supabase: SupabaseClient, routeId: string): Promise<string[]> {
  const { data } = await supabase
    .from("learning_route_edges")
    .select("id")
    .eq("learning_route_id", routeId)
    .limit(120);
  return ((data ?? []) as { id: string }[]).map((row) => row.id);
}

async function loadRouteCheckpoints(supabase: SupabaseClient, routeId: string) {
  const edgeIds = await loadRouteEdgeIds(supabase, routeId);
  if (edgeIds.length === 0) return { data: [] };
  return supabase
    .from("learning_route_checkpoints")
    .select(
      "id, learning_route_edge_id, assessment_id, is_required, is_priority, blocks_progress, contributes_to_gradebook, max_score, passing_score, weight, learning_assessments(title, assessment_kind, grading_mode)",
    )
    .in("learning_route_edge_id", edgeIds)
    .limit(120);
}

export async function buildLearningRouteWorkspace(
  supabase: SupabaseClient,
  route: LearningRouteModel | null,
  sectionId: string | null,
  assignment: SectionLearningRouteAssignment | null = null,
): Promise<LearningRouteWorkspace> {
  const [steps, edges, checkpoints, templates, questions, assessments, readiness] = await Promise.all([
    route?.id
      ? supabase
          .from("learning_route_steps")
          .select("id, content_template_id, title, sort_order, lesson_kind, is_required, position_x, position_y, content_templates(title)")
          .eq("learning_route_id", route.id)
          .order("sort_order", { ascending: true })
          .limit(80)
      : Promise.resolve({ data: [] }),
    route?.id
      ? supabase
          .from("learning_route_edges")
          .select("id, from_step_id, to_step_id, sort_order, label, condition_kind")
          .eq("learning_route_id", route.id)
          .order("sort_order", { ascending: true })
          .limit(120)
      : Promise.resolve({ data: [] }),
    route?.id ? loadRouteCheckpoints(supabase, route.id) : Promise.resolve({ data: [] }),
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

  const assessmentRows = (assessments.data ?? []) as {
    id: string;
    title: string;
    assessment_kind: string;
    grading_mode: LearningAssessmentModel["gradingMode"];
  }[];
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
      position_x: number | string;
      position_y: number | string;
      content_templates?: { title: string } | { title: string }[] | null;
    }[]).map((row) => ({
      id: row.id,
      contentTemplateId: row.content_template_id,
      contentTitle: firstRelation(row.content_templates)?.title ?? row.title,
      title: row.title,
      sortOrder: row.sort_order,
      stepKind: row.lesson_kind,
      isRequired: row.is_required,
      positionX: Number(row.position_x),
      positionY: Number(row.position_y),
    })),
    routeEdges: ((edges.data ?? []) as {
      id: string;
      from_step_id: string;
      to_step_id: string;
      sort_order: number;
      label: string;
      condition_kind: string;
    }[]).map((row) => ({
      id: row.id,
      fromStepId: row.from_step_id,
      toStepId: row.to_step_id,
      sortOrder: row.sort_order,
      label: row.label,
      conditionKind: row.condition_kind,
    })),
    routeCheckpoints: ((checkpoints.data ?? []) as {
      id: string;
      learning_route_edge_id: string;
      assessment_id: string | null;
      is_required: boolean;
      is_priority: boolean;
      blocks_progress: boolean;
      contributes_to_gradebook: boolean;
      max_score: number | string | null;
      passing_score: number | string | null;
      weight: number | string | null;
      learning_assessments?:
        | {
            title: string;
            assessment_kind: string;
            grading_mode: LearningAssessmentModel["gradingMode"];
          }
        | {
            title: string;
            assessment_kind: string;
            grading_mode: LearningAssessmentModel["gradingMode"];
          }[]
        | null;
    }[]).map((row) => {
      const assessment = firstRelation(row.learning_assessments);
      return {
        id: row.id,
        edgeId: row.learning_route_edge_id,
        assessmentId: row.assessment_id,
        assessmentTitle: assessment?.title ?? null,
        assessmentKind: assessment?.assessment_kind ?? null,
        gradingMode: assessment?.grading_mode ?? null,
        isRequired: row.is_required,
        isPriority: row.is_priority,
        blocksProgress: row.blocks_progress,
        contributesToGradebook: row.contributes_to_gradebook,
        maxScore: row.max_score === null ? null : Number(row.max_score),
        passingScore: row.passing_score === null ? null : Number(row.passing_score),
        weight: row.weight === null ? null : Number(row.weight),
      };
    }),
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
    health: buildSectionContentHealth(route, sectionId, assessmentRows, readinessRows),
    assignment,
  };
}

function buildSectionContentHealth(
  route: LearningRouteModel | null,
  sectionId: string | null,
  assessmentRows: { assessment_kind: string }[],
  readinessRows: { readiness_status: string }[],
): SectionContentHealth {
  return {
    missingObjectives: route
      ? !route.teacherObjectives.trim() || !route.generalScope.trim() || !route.evaluationCriteria.trim()
      : true,
    missingEntryAssessment: sectionId ? !assessmentRows.some((row) => row.assessment_kind === "entry") : false,
    missingExitAssessment: sectionId ? !assessmentRows.some((row) => row.assessment_kind === "exit") : false,
    needsSupportCount: readinessRows.filter((row) => row.readiness_status === "needs_support").length,
    teacherOverrideCount: readinessRows.filter((row) => row.readiness_status === "teacher_override").length,
  };
}
