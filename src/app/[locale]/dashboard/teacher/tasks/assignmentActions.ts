"use server";

import { revalidatePath } from "next/cache";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { logServerException } from "@/lib/logging/serverActionLog";
import {
  auditLearningTaskStaffAction,
  cloneTemplatePayload,
  staffCanManageLearningSection,
  validateTaskDateRange,
} from "@/lib/learning-tasks";
import { AssignSchema, type LearningTaskActionResult } from "./actionShared";

type TemplateRow = { id: string; title: string; body_html: string };
type AssetRow = {
  id: string;
  kind: "file" | "embed";
  label: string;
  storage_path: string | null;
  mime_type: string | null;
  byte_size: number | null;
  embed_provider: "youtube" | "vimeo" | null;
  embed_url: string | null;
  sort_order: number;
};

function normalizeAsset(row: AssetRow) {
  if (row.kind === "file") {
    return {
      id: row.id,
      kind: "file" as const,
      label: row.label,
      storagePath: row.storage_path ?? "",
      mimeType: row.mime_type ?? "",
      byteSize: Number(row.byte_size ?? 0),
      sortOrder: row.sort_order,
    };
  }
  return {
    id: row.id,
    kind: "embed" as const,
    label: row.label,
    embedProvider: row.embed_provider ?? "youtube",
    embedUrl: row.embed_url ?? "",
    sortOrder: row.sort_order,
  };
}

export async function assignTemplateToSectionAction(raw: unknown): Promise<LearningTaskActionResult> {
  const parsed = AssignSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    validateTaskDateRange(parsed.data.startAt, parsed.data.dueAt);
  } catch {
    return { ok: false, code: "invalid_input" };
  }

  try {
    const { supabase, user } = await assertTeacher();
    const canManage = await staffCanManageLearningSection(supabase, user.id, parsed.data.sectionId);
    if (!canManage) return { ok: false, code: "forbidden" };

    const [{ data: template }, { data: assets }] = await Promise.all([
      supabase.from("content_templates").select("id, title, body_html").eq("id", parsed.data.templateId).maybeSingle(),
      supabase
        .from("content_template_assets")
        .select("id, kind, label, storage_path, mime_type, byte_size, embed_provider, embed_url, sort_order")
        .eq("template_id", parsed.data.templateId)
        .order("sort_order", { ascending: true }),
    ]);
    if (!template) return { ok: false, code: "not_found" };

    const tpl = template as TemplateRow;
    const cloned = cloneTemplatePayload({
      templateId: tpl.id,
      title: parsed.data.title ?? tpl.title,
      bodyHtml: tpl.body_html,
      assets: ((assets ?? []) as AssetRow[]).map(normalizeAsset),
    });

    const { data: instance, error: instanceError } = await supabase
      .from("task_instances")
      .insert({
        template_id: cloned.templateId,
        section_id: parsed.data.sectionId,
        title: cloned.title,
        body_html: cloned.bodyHtml,
        start_at: parsed.data.startAt,
        due_at: parsed.data.dueAt,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (instanceError || !instance) return { ok: false, code: "persist_failed" };
    const instanceId = (instance as { id: string }).id;

    if (cloned.assets.length > 0) {
      const { error } = await supabase.from("task_instance_assets").insert(
        cloned.assets.map((asset) => ({
          task_instance_id: instanceId,
          template_asset_id: asset.templateAssetId,
          kind: asset.kind,
          label: asset.label,
          storage_path: asset.kind === "file" ? asset.storagePath : null,
          mime_type: asset.kind === "file" ? asset.mimeType : null,
          byte_size: asset.kind === "file" ? asset.byteSize : null,
          embed_provider: asset.kind === "embed" ? asset.embedProvider : null,
          embed_url: asset.kind === "embed" ? asset.embedUrl : null,
          sort_order: asset.sortOrder,
        })),
      );
      if (error) return { ok: false, code: "persist_failed" };
    }

    const { data: enrollments } = await supabase
      .from("section_enrollments")
      .select("id, student_id")
      .eq("section_id", parsed.data.sectionId)
      .eq("status", "active");
    const progressRows = (enrollments ?? []).map((e) => ({
      task_instance_id: instanceId,
      enrollment_id: e.id as string,
      student_id: e.student_id as string,
    }));
    if (progressRows.length > 0) {
      const { error } = await supabase.from("student_task_progress").insert(progressRows);
      if (error) return { ok: false, code: "persist_failed" };
    }

    await auditLearningTaskStaffAction({
      actorId: user.id,
      action: "content_template_assigned_to_section",
      resourceType: "task_instance",
      resourceId: instanceId,
      payload: { templateId: cloned.templateId, sectionId: parsed.data.sectionId },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}`);
    return { ok: true, id: instanceId };
  } catch (err) {
    logServerException("assignTemplateToSectionAction", err);
    return { ok: false, code: "forbidden" };
  }
}
