"use server";

import { revalidatePath } from "next/cache";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  LEARNING_TASK_ASSET_BUCKET,
  auditLearningTaskStaffAction,
  buildLearningTaskAssetPath,
  normalizeVideoEmbedUrl,
  sanitizeLearningTaskHtml,
  validateLearningTaskFile,
} from "@/lib/learning-tasks";
import {
  EmbedSchema,
  TemplateSchema,
  UploadSchema,
  decodeBase64,
  type LearningTaskActionResult,
} from "./actionShared";

export async function saveContentTemplateAction(raw: unknown): Promise<LearningTaskActionResult> {
  const parsed = TemplateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const safeBody = sanitizeLearningTaskHtml(parsed.data.bodyHtml);
  if (!safeBody) return { ok: false, code: "empty_body" };

  try {
    const { supabase, user } = await assertTeacher();
    const payload = { title: parsed.data.title, body_html: safeBody, updated_by: user.id };
    const query = parsed.data.id
      ? supabase.from("content_templates").update(payload).eq("id", parsed.data.id).select("id").single()
      : supabase.from("content_templates").insert({ ...payload, created_by: user.id }).select("id").single();
    const { data, error } = await query;
    if (error || !data) {
      logSupabaseClientError("saveContentTemplateAction:upsert", error, { id: parsed.data.id });
      return { ok: false, code: "persist_failed" };
    }

    const id = (data as { id: string }).id;
    await auditLearningTaskStaffAction({
      actorId: user.id,
      action: parsed.data.id ? "content_template_updated" : "content_template_created",
      resourceType: "content_template",
      resourceId: id,
      payload: { titleLength: parsed.data.title.length, bodyLength: safeBody.length },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/tasks`);
    return { ok: true, id };
  } catch (err) {
    logServerException("saveContentTemplateAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function addTemplateEmbedAction(raw: unknown): Promise<LearningTaskActionResult> {
  const parsed = EmbedSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const normalized = normalizeVideoEmbedUrl(parsed.data.url);
  if (!normalized.ok) return { ok: false, code: normalized.code };

  try {
    const { supabase, user } = await assertTeacher();
    const { data, error } = await supabase
      .from("content_template_assets")
      .insert({
        template_id: parsed.data.templateId,
        kind: "embed",
        label: parsed.data.label,
        embed_provider: normalized.provider,
        embed_url: normalized.embedUrl,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningTaskStaffAction({
      actorId: user.id,
      action: "content_template_embed_added",
      resourceType: "content_template",
      resourceId: parsed.data.templateId,
      payload: { provider: normalized.provider },
    });
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("addTemplateEmbedAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function uploadTemplateFileAction(raw: unknown): Promise<LearningTaskActionResult> {
  const parsed = UploadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const bytes = decodeBase64(parsed.data.fileBase64);
  if (!bytes) return { ok: false, code: "invalid_input" };
  const validated = validateLearningTaskFile({
    name: parsed.data.filename,
    size: bytes.byteLength,
    type: parsed.data.contentType,
  });
  if (!validated.ok) return { ok: false, code: validated.code };

  try {
    const { supabase, user } = await assertTeacher();
    const assetId = crypto.randomUUID();
    const storagePath = buildLearningTaskAssetPath({
      scope: "templates",
      ownerId: parsed.data.templateId,
      assetId,
      filename: parsed.data.filename,
      mime: validated.mime,
    });
    const upload = await supabase.storage
      .from(LEARNING_TASK_ASSET_BUCKET)
      .upload(storagePath, bytes, { contentType: validated.mime, upsert: false });
    if (upload.error) return { ok: false, code: "persist_failed" };

    const { data, error } = await supabase
      .from("content_template_assets")
      .insert({
        id: assetId,
        template_id: parsed.data.templateId,
        kind: "file",
        label: parsed.data.label,
        storage_path: storagePath,
        mime_type: validated.mime,
        byte_size: bytes.byteLength,
      })
      .select("id")
      .single();
    if (error || !data) {
      await supabase.storage.from(LEARNING_TASK_ASSET_BUCKET).remove([storagePath]);
      return { ok: false, code: "persist_failed" };
    }
    await auditLearningTaskStaffAction({
      actorId: user.id,
      action: "content_template_file_uploaded",
      resourceType: "content_template",
      resourceId: parsed.data.templateId,
      payload: { bytes: bytes.byteLength, mime: validated.mime },
    });
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("uploadTemplateFileAction", err);
    return { ok: false, code: "forbidden" };
  }
}
