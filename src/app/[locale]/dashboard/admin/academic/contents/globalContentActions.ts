"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";
import {
  LEARNING_TASK_ASSET_BUCKET,
  buildLearningTaskAssetPath,
  normalizeVideoEmbedUrl,
  validateLearningTaskFile,
} from "@/lib/learning-tasks";
import { sanitizeLearningTaskHtml } from "@/lib/learning-tasks/sanitizeLearningTaskHtml";

type ContentActionResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "empty_body" | "persist_failed" | "forbidden" };

const GlobalContentSchema = z.object({
  locale: z.string().min(2).max(8),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1200),
  bodyHtml: z.string().trim().max(80_000),
});

const EmbedSchema = z.object({
  templateId: z.string().uuid(),
  label: z.string().trim().min(1).max(180),
  url: z.string().trim().url(),
});

const UploadSchema = z.object({
  templateId: z.string().uuid(),
  label: z.string().trim().min(1).max(180),
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(1).max(120),
  fileBase64: z.string().min(1),
});

function decodeBase64(value: string): Uint8Array | null {
  try {
    return Uint8Array.from(Buffer.from(value, "base64"));
  } catch {
    return null;
  }
}

export async function saveGlobalContentAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = GlobalContentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const safeBody = sanitizeLearningTaskHtml(parsed.data.bodyHtml);
  if (!safeBody) return { ok: false, code: "empty_body" };
  try {
    const { supabase, user } = await assertAdmin();
    const { data, error } = await supabase
      .from("content_templates")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description,
        body_html: safeBody,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    const id = (data as { id: string }).id;
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.global_content_created",
      resourceType: "content_templates",
      resourceId: id,
      payload: { titleLength: parsed.data.title.length, descriptionLength: parsed.data.description.length },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    return { ok: true, id };
  } catch (err) {
    logServerException("saveGlobalContentAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function addGlobalContentEmbedAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = EmbedSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const normalized = normalizeVideoEmbedUrl(parsed.data.url);
  if (!normalized.ok) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
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
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.global_content_embed_added",
      resourceType: "content_templates",
      resourceId: parsed.data.templateId,
      payload: { provider: normalized.provider },
    });
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("addGlobalContentEmbedAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function uploadGlobalContentFileAction(raw: unknown): Promise<ContentActionResult> {
  const parsed = UploadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const bytes = decodeBase64(parsed.data.fileBase64);
  if (!bytes) return { ok: false, code: "invalid_input" };
  const validation = validateLearningTaskFile({
    name: parsed.data.filename,
    size: bytes.byteLength,
    type: parsed.data.contentType,
  });
  if (!validation.ok) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const assetId = crypto.randomUUID();
    const storagePath = buildLearningTaskAssetPath({
      scope: "templates",
      ownerId: parsed.data.templateId,
      assetId,
      filename: parsed.data.filename,
      mime: validation.mime,
    });
    const upload = await supabase.storage
      .from(LEARNING_TASK_ASSET_BUCKET)
      .upload(storagePath, bytes, { contentType: validation.mime, upsert: false });
    if (upload.error) return { ok: false, code: "persist_failed" };
    const { data, error } = await supabase
      .from("content_template_assets")
      .insert({
        id: assetId,
        template_id: parsed.data.templateId,
        kind: "file",
        label: parsed.data.label,
        storage_path: storagePath,
        mime_type: validation.mime,
        byte_size: bytes.byteLength,
      })
      .select("id")
      .single();
    if (error || !data) {
      await supabase.storage.from(LEARNING_TASK_ASSET_BUCKET).remove([storagePath]);
      return { ok: false, code: "persist_failed" };
    }
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.global_content_file_uploaded",
      resourceType: "content_templates",
      resourceId: parsed.data.templateId,
      payload: { bytes: bytes.byteLength, mime: validation.mime },
    });
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("uploadGlobalContentFileAction", err);
    return { ok: false, code: "forbidden" };
  }
}
