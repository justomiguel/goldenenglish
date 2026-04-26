"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";
import { logServerException } from "@/lib/logging/serverActionLog";
import {
  LEARNING_TASK_ASSET_BUCKET,
  buildLearningTaskAssetPath,
  normalizeVideoEmbedUrl,
  validateLearningTaskFile,
} from "@/lib/learning-tasks";
import { sanitizeLearningTaskHtml } from "@/lib/learning-tasks/sanitizeLearningTaskHtml";

type BuilderResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "empty_body" | "persist_failed" | "forbidden" };

type SignedUploadResult =
  | { ok: true; assetId: string; storagePath: string; token: string }
  | { ok: false; code: "invalid_input" | "persist_failed" | "forbidden" };

type Supabase = Awaited<ReturnType<typeof assertAdmin>>["supabase"];

const MaterialSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("embed"),
    existingAssetId: z.string().uuid().optional(),
    label: z.string().trim().min(1).max(180),
    url: z.string().trim().url(),
    sortOrder: z.number().int().min(0).max(200),
  }),
  z.object({
    kind: z.literal("file"),
    existingAssetId: z.string().uuid().optional(),
    uploadedAssetId: z.string().uuid().optional(),
    storagePath: z.string().trim().min(1).max(500).optional(),
    label: z.string().trim().min(1).max(180),
    filename: z.string().trim().min(1).max(240).optional(),
    contentType: z.string().trim().min(1).max(120).optional(),
    byteSize: z.number().int().min(1).max(50 * 1024 * 1024).optional(),
    sortOrder: z.number().int().min(0).max(200),
  }),
]);

const PayloadSchema = z.object({
  locale: z.string().min(2).max(8),
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1200),
  bodyHtml: z.string().trim().max(80_000),
  materials: z.array(MaterialSchema).max(60),
});

const SignedUploadSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(1).max(120),
  byteSize: z.number().int().min(1).max(50 * 1024 * 1024),
});

const CleanupUploadSchema = z.object({
  storagePath: z.string().trim().min(1).max(500),
});

function blockKindForMime(mime: string): "file" | "audio" | "image" | "pdf" {
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return "file";
}

async function removeDroppedAssets(input: { supabase: Supabase; templateId: string; keepAssetIds: string[] }) {
  const { data } = await input.supabase
    .from("content_template_assets")
    .select("id, storage_path")
    .eq("template_id", input.templateId);
  const dropped = ((data ?? []) as { id: string; storage_path: string | null }[])
    .filter((asset) => !input.keepAssetIds.includes(asset.id));
  if (dropped.length === 0) return;
  const paths = dropped.flatMap((asset) => asset.storage_path ? [asset.storage_path] : []);
  if (paths.length > 0) await input.supabase.storage.from(LEARNING_TASK_ASSET_BUCKET).remove(paths);
  await input.supabase.from("content_template_assets").delete().in("id", dropped.map((asset) => asset.id));
}

export async function prepareGlobalContentFileUploadAction(raw: unknown): Promise<SignedUploadResult> {
  const parsed = SignedUploadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const validation = validateLearningTaskFile({
    name: parsed.data.filename,
    size: parsed.data.byteSize,
    type: parsed.data.contentType,
  });
  if (!validation.ok) return { ok: false, code: "invalid_input" };

  try {
    const { supabase, user } = await assertAdmin();
    const assetId = crypto.randomUUID();
    const storagePath = buildLearningTaskAssetPath({
      scope: "templates",
      ownerId: user.id,
      assetId,
      filename: parsed.data.filename,
      mime: validation.mime,
    });
    const { data, error } = await supabase.storage
      .from(LEARNING_TASK_ASSET_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data) return { ok: false, code: "persist_failed" };
    return { ok: true, assetId, storagePath, token: data.token };
  } catch (err) {
    logServerException("prepareGlobalContentFileUploadAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function cleanupGlobalContentPendingUploadAction(raw: unknown): Promise<{ ok: true } | { ok: false }> {
  const parsed = CleanupUploadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  try {
    const { supabase } = await assertAdmin();
    await supabase.storage.from(LEARNING_TASK_ASSET_BUCKET).remove([parsed.data.storagePath]);
    return { ok: true };
  } catch (err) {
    logServerException("cleanupGlobalContentPendingUploadAction", err);
    return { ok: false };
  }
}

export async function saveGlobalContentBuilderMetadataAction(raw: unknown): Promise<BuilderResult> {
  const payload = PayloadSchema.safeParse(raw);
  if (!payload.success) return { ok: false, code: "invalid_input" };
  const parsed = payload.data;
  const safeBody = sanitizeLearningTaskHtml(parsed.bodyHtml);
  if (!safeBody && parsed.materials.length === 0) return { ok: false, code: "empty_body" };

  try {
    const { supabase, user } = await assertAdmin();
    const templatePayload = {
      title: parsed.title,
      description: parsed.description,
      body_html: safeBody,
      updated_by: user.id,
    };
    const query = parsed.id
      ? supabase.from("content_templates").update(templatePayload).eq("id", parsed.id).select("id").single()
      : supabase.from("content_templates").insert({ ...templatePayload, created_by: user.id }).select("id").single();
    const { data, error } = await query;
    if (error || !data) return { ok: false, code: "persist_failed" };
    const templateId = (data as { id: string }).id;

    await supabase.from("content_template_blocks").delete().eq("template_id", templateId);
    const keepAssetIds = parsed.materials.flatMap((m) => m.existingAssetId ? [m.existingAssetId] : []);
    if (parsed.id) await removeDroppedAssets({ supabase, templateId, keepAssetIds });

    const blocks: Record<string, unknown>[] = safeBody
      ? [{ template_id: templateId, kind: "text", sort_order: 0, payload: { bodyHtml: safeBody } }]
      : [];
    const materialSortOffset = safeBody ? 1 : 0;

    for (const material of parsed.materials) {
      const assetId = material.existingAssetId ?? (material.kind === "file" ? material.uploadedAssetId : undefined) ?? crypto.randomUUID();
      const payload: Record<string, unknown> = { label: material.label };
      let kind: "file" | "audio" | "image" | "pdf" | "video_embed" = "file";

      if (material.kind === "embed") {
        const normalized = normalizeVideoEmbedUrl(material.url);
        if (!normalized.ok) return { ok: false, code: "invalid_input" };
        kind = "video_embed";
        payload.embedUrl = normalized.embedUrl;
        if (!material.existingAssetId) {
          const { error: assetError } = await supabase.from("content_template_assets").insert({
            id: assetId,
            template_id: templateId,
            kind: "embed",
            label: material.label,
            embed_provider: normalized.provider,
            embed_url: normalized.embedUrl,
          });
          if (assetError) return { ok: false, code: "persist_failed" };
        }
      } else if (!material.existingAssetId) {
        if (!material.uploadedAssetId || !material.storagePath || !material.filename || !material.contentType || !material.byteSize) {
          return { ok: false, code: "invalid_input" };
        }
        const validation = validateLearningTaskFile({
          name: material.filename,
          size: material.byteSize,
          type: material.contentType,
        });
        if (!validation.ok) return { ok: false, code: "invalid_input" };
        kind = blockKindForMime(validation.mime);
        const { error: assetError } = await supabase.from("content_template_assets").insert({
          id: material.uploadedAssetId,
          template_id: templateId,
          kind: "file",
          label: material.label,
          storage_path: material.storagePath,
          mime_type: validation.mime,
          byte_size: material.byteSize,
        });
        if (assetError) return { ok: false, code: "persist_failed" };
        payload.mime = validation.mime;
      }

      blocks.push({ template_id: templateId, asset_id: assetId, kind, sort_order: material.sortOrder + materialSortOffset, payload });
    }

    const { error: blockError } = await supabase.from("content_template_blocks").insert(blocks);
    if (blockError) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: parsed.id ? "learning_content.global_content_updated" : "learning_content.global_content_created",
      resourceType: "content_templates",
      resourceId: templateId,
      payload: { materialCount: parsed.materials.length },
    });
    revalidatePath(`/${parsed.locale}/dashboard/admin/academic/contents`);
    return { ok: true, id: templateId };
  } catch (err) {
    logServerException("saveGlobalContentBuilderMetadataAction", err);
    return { ok: false, code: "forbidden" };
  }
}
