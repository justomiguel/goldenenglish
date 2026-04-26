import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningRouteContentTemplateOption } from "@/types/learningContent";
import type { LearningRouteWorkspace } from "@/lib/learning-content/learningRouteWorkspaceModel";
import { buildLearningRouteWorkspace } from "@/lib/learning-content/buildLearningRouteWorkspace";
import {
  type AssignmentRow,
  firstRelation,
  mapRouteRowToModel,
  type RouteRow,
} from "@/lib/learning-content/learningRouteWorkspaceMapping";

export type { LearningRouteWorkspace } from "@/lib/learning-content/learningRouteWorkspaceModel";

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
  const route = routeRow ? mapRouteRowToModel(routeRow) : null;
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
    .select(
      "id, section_id, learning_route_id, mode, learning_routes(id, title, teacher_objectives, general_scope, evaluation_criteria, status)",
    )
    .eq("section_id", sectionId)
    .maybeSingle();
  const assignmentRow = assignmentData as AssignmentRow | null;
  const routeRow = firstRelation(assignmentRow?.learning_routes);
  const route = assignmentRow?.mode === "route" && routeRow ? mapRouteRowToModel(routeRow) : null;
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
