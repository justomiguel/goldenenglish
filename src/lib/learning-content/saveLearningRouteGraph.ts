import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import type { LearningRouteGraphSchema } from "@/lib/learning-content/contentsActionsSchemas";

type GraphPayload = z.infer<typeof LearningRouteGraphSchema>;
type GraphSaveResult = { ok: true; id: string } | { ok: false; code: "invalid_input" | "persist_failed" };

type TemplateRow = {
  id: string;
  title: string;
  body_html: string;
};

const unique = (values: string[]) => [...new Set(values)];

export async function saveLearningRouteGraph(
  supabase: SupabaseClient,
  userId: string,
  payload: GraphPayload,
): Promise<GraphSaveResult> {
  const templateIds = unique(payload.nodes.map((node) => node.contentTemplateId));
  const templates = await loadTemplates(supabase, templateIds);
  if (templates.size !== templateIds.length) return { ok: false, code: "invalid_input" };

  const existingSteps = await loadIds(supabase, "learning_route_steps", "learning_route_id", payload.routeId);
  const nextStepIds = new Set(payload.nodes.map((node) => node.id));
  const stepDeleteIds = existingSteps.filter((id) => !nextStepIds.has(id));
  if (!(await deleteByIds(supabase, "learning_route_steps", stepDeleteIds))) return { ok: false, code: "persist_failed" };

  const stepRows = payload.nodes.map((node) => {
    const template = templates.get(node.contentTemplateId)!;
    return {
      id: node.id,
      learning_route_id: payload.routeId,
      content_template_id: node.contentTemplateId,
      title: template.title,
      body_html: template.body_html,
      sort_order: node.sortOrder,
      lesson_kind: node.stepKind,
      is_required: node.isRequired,
      position_x: node.positionX,
      position_y: node.positionY,
      created_by: userId,
      updated_by: userId,
    };
  });
  if (stepRows.length > 0) {
    const { error } = await supabase.from("learning_route_steps").upsert(stepRows, { onConflict: "id" });
    if (error) return { ok: false, code: "persist_failed" };
  }

  const existingEdges = await loadIds(supabase, "learning_route_edges", "learning_route_id", payload.routeId);
  const nextEdgeIds = new Set(payload.edges.map((edge) => edge.id));
  const edgeDeleteIds = existingEdges.filter((id) => !nextEdgeIds.has(id));
  if (!(await deleteByIds(supabase, "learning_route_edges", edgeDeleteIds))) return { ok: false, code: "persist_failed" };

  const edgeRows = payload.edges.map((edge) => ({
    id: edge.id,
    learning_route_id: payload.routeId,
    from_step_id: edge.fromStepId,
    to_step_id: edge.toStepId,
    sort_order: edge.sortOrder,
    label: edge.label,
    condition_kind: edge.conditionKind,
    created_by: userId,
    updated_by: userId,
  }));
  if (edgeRows.length > 0) {
    const { error } = await supabase.from("learning_route_edges").upsert(edgeRows, { onConflict: "id" });
    if (error) return { ok: false, code: "persist_failed" };
  }

  return saveCheckpoints(supabase, userId, payload);
}

async function loadTemplates(supabase: SupabaseClient, templateIds: string[]) {
  if (templateIds.length === 0) return new Map<string, TemplateRow>();
  const { data } = await supabase
    .from("content_templates")
    .select("id, title, body_html")
    .in("id", templateIds)
    .is("archived_at", null);
  return new Map(((data ?? []) as TemplateRow[]).map((row) => [row.id, row]));
}

async function loadIds(
  supabase: SupabaseClient,
  table: "learning_route_steps" | "learning_route_edges",
  column: string,
  value: string,
): Promise<string[]> {
  const { data } = await supabase.from(table).select("id").eq(column, value).limit(200);
  return ((data ?? []) as { id: string }[]).map((row) => row.id);
}

async function deleteByIds(
  supabase: SupabaseClient,
  table: "learning_route_steps" | "learning_route_edges" | "learning_route_checkpoints",
  ids: string[],
) {
  if (ids.length === 0) return true;
  const { error } = await supabase.from(table).delete().in("id", ids);
  return !error;
}

async function saveCheckpoints(
  supabase: SupabaseClient,
  userId: string,
  payload: GraphPayload,
): Promise<GraphSaveResult> {
  const edgeIds = payload.edges.map((edge) => edge.id);
  const currentCheckpoints = await loadCurrentCheckpoints(supabase, edgeIds);
  const currentByEdge = new Map(currentCheckpoints.map((row) => [row.learning_route_edge_id, row]));
  const enabledEdgeIds = new Set(payload.checkpoints.filter((checkpoint) => checkpoint.enabled).map((checkpoint) => checkpoint.edgeId));
  const deleteCheckpointIds = currentCheckpoints
    .filter((row) => !enabledEdgeIds.has(row.learning_route_edge_id))
    .map((row) => row.id);
  if (!(await deleteByIds(supabase, "learning_route_checkpoints", deleteCheckpointIds))) {
    return { ok: false, code: "persist_failed" };
  }

  const edgeById = new Map(payload.edges.map((edge) => [edge.id, edge]));
  for (const checkpoint of payload.checkpoints) {
    if (!checkpoint.enabled) continue;
    const edge = edgeById.get(checkpoint.edgeId);
    if (!edge) return { ok: false, code: "invalid_input" };
    const assessment = await upsertCheckpointAssessment(supabase, userId, edge.fromStepId, checkpoint);
    if (!assessment.ok) return assessment;
    const existing = currentByEdge.get(checkpoint.edgeId);
    const { error } = await supabase.from("learning_route_checkpoints").upsert({
      id: checkpoint.id ?? existing?.id ?? randomUUID(),
      learning_route_edge_id: checkpoint.edgeId,
      assessment_id: assessment.id,
      is_required: checkpoint.isRequired,
      is_priority: checkpoint.isPriority,
      blocks_progress: checkpoint.blocksProgress,
      contributes_to_gradebook: checkpoint.isPriority,
      max_score: checkpoint.maxScore ?? null,
      passing_score: checkpoint.passingScore ?? null,
      weight: checkpoint.weight ?? null,
      created_by: userId,
      updated_by: userId,
    }, { onConflict: "id" });
    if (error) return { ok: false, code: "persist_failed" };
  }

  return { ok: true, id: payload.routeId };
}

async function loadCurrentCheckpoints(supabase: SupabaseClient, edgeIds: string[]) {
  if (edgeIds.length === 0) return [];
  const { data } = await supabase
    .from("learning_route_checkpoints")
    .select("id, learning_route_edge_id, assessment_id")
    .in("learning_route_edge_id", edgeIds)
    .limit(200);
  return (data ?? []) as { id: string; learning_route_edge_id: string; assessment_id: string | null }[];
}

async function upsertCheckpointAssessment(
  supabase: SupabaseClient,
  userId: string,
  fromStepId: string,
  checkpoint: GraphPayload["checkpoints"][number],
): Promise<GraphSaveResult> {
  const row = {
    learning_route_step_id: fromStepId,
    assessment_kind: checkpoint.assessmentKind,
    grading_mode: checkpoint.gradingMode,
    title: checkpoint.title,
    instructions: checkpoint.instructions,
    passing_score: checkpoint.passingScore ?? null,
    required_for_completion: checkpoint.blocksProgress,
    updated_by: userId,
  };
  const query = checkpoint.assessmentId
    ? supabase.from("learning_assessments").update(row).eq("id", checkpoint.assessmentId)
    : supabase.from("learning_assessments").insert({ ...row, created_by: userId });
  const { data, error } = await query.select("id").single();
  if (error || !data) return { ok: false, code: "persist_failed" };
  return { ok: true, id: (data as { id: string }).id };
}
