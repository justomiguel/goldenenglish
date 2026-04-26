"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";
import {
  DeleteLearningRouteSchema,
  LearningRouteGraphSchema,
  LearningRouteSchema,
  RouteStepSchema,
  SectionLearningRouteSchema,
} from "@/lib/learning-content/contentsActionsSchemas";
import { saveLearningRouteGraph } from "@/lib/learning-content/saveLearningRouteGraph";
import type { ContentActionResult } from "@/app/[locale]/dashboard/admin/academic/contents/contentsActionShared";

export async function saveLearningRouteAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = LearningRouteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const payload = {
      title: parsed.data.title,
      teacher_objectives: parsed.data.teacherObjectives,
      general_scope: parsed.data.generalScope,
      evaluation_criteria: parsed.data.evaluationCriteria,
      updated_by: user.id,
    };
    const query = parsed.data.routeId
      ? supabase.from("learning_routes").update(payload).eq("id", parsed.data.routeId)
      : supabase.from("learning_routes").insert({ ...payload, created_by: user.id });
    const { data, error } = await query.select("id").single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.admin_learning_route_saved",
      resourceType: "learning_routes",
      resourceId: (data as { id: string }).id,
      payload: {},
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents/sections/global/edit`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("saveLearningRouteAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function deleteLearningRouteAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = DeleteLearningRouteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const [steps, assignments] = await Promise.all([
      supabase
        .from("learning_route_steps")
        .select("id", { count: "exact", head: true })
        .eq("learning_route_id", parsed.data.routeId),
      supabase
        .from("section_learning_routes")
        .select("id", { count: "exact", head: true })
        .eq("learning_route_id", parsed.data.routeId),
    ]);
    const { error } = await supabase.from("learning_routes").delete().eq("id", parsed.data.routeId);
    if (error) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.learning_route_deleted",
      resourceType: "learning_routes",
      resourceId: parsed.data.routeId,
      payload: {
        removedRouteSteps: steps.count ?? 0,
        removedSectionAssignments: assignments.count ?? 0,
      },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents/sections`);
    return { ok: true, id: parsed.data.routeId };
  } catch (err) {
    logServerException("deleteLearningRouteAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function saveLearningRouteGraphAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = LearningRouteGraphSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const result = await saveLearningRouteGraph(supabase, user.id, parsed.data);
    if (!result.ok) return result;
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.learning_route_graph_saved",
      resourceType: "learning_routes",
      resourceId: parsed.data.routeId,
      payload: {
        nodeCount: parsed.data.nodes.length,
        edgeCount: parsed.data.edges.length,
        checkpointCount: parsed.data.checkpoints.filter((checkpoint) => checkpoint.enabled).length,
      },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents/sections/${parsed.data.routeId}/edit`);
    return { ok: true, id: parsed.data.routeId };
  } catch (err) {
    logServerException("saveLearningRouteGraphAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function saveSectionLearningRouteAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = SectionLearningRouteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { data, error } = await supabase
      .from("section_learning_routes")
      .upsert(
        {
          section_id: parsed.data.sectionId,
          learning_route_id: parsed.data.learningRouteId,
          mode: parsed.data.mode,
          created_by: user.id,
          updated_by: user.id,
        },
        { onConflict: "section_id" },
      )
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.section_learning_route_saved",
      resourceType: "section_learning_routes",
      resourceId: (data as { id: string }).id,
      payload: {
        sectionId: parsed.data.sectionId,
        learningRouteId: parsed.data.learningRouteId,
        mode: parsed.data.mode,
      },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/${parsed.data.cohortId}/${parsed.data.sectionId}`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("saveSectionLearningRouteAction", err);
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
