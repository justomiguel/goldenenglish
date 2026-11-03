import type { SupabaseClient } from "@supabase/supabase-js";
import { LEARNING_TASK_ASSET_BUCKET } from "@/lib/learning-tasks/assets";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { buildLessonMaterials, withSignedLessonFiles } from "@/lib/courses/lessonMaterials";

type AssetJoin = {
  label: string | null;
  storage_path: string | null;
  mime_type: string | null;
} | null;

type BlockRow = {
  id: string;
  kind: string;
  sort_order: number;
  payload: Record<string, unknown> | null;
  content_template_assets: AssetJoin | AssetJoin[];
};

function firstAsset(value: AssetJoin | AssetJoin[]): AssetJoin {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadLessonMaterials(admin: SupabaseClient, templateId: string) {
  const [{ data: template, error }, blocksResult] = await Promise.all([
    admin.from("content_templates").select("body_html").eq("id", templateId).maybeSingle(),
    admin
      .from("content_template_blocks")
      .select("id, kind, sort_order, payload, content_template_assets(label, storage_path, mime_type)")
      .eq("template_id", templateId)
      .order("sort_order", { ascending: true })
      .limit(40),
  ]);
  if (error) logSupabaseClientError("loadLessonMaterials:template", error, { templateId });
  if (blocksResult.error) {
    logSupabaseClientError("loadLessonMaterials:blocks", blocksResult.error, { templateId });
  }

  const blocks = ((blocksResult.data ?? []) as BlockRow[]).map((row) => {
    const asset = firstAsset(row.content_template_assets);
    return {
      id: row.id,
      kind: row.kind,
      sortOrder: row.sort_order,
      payload: row.payload ?? {},
      storagePath: asset?.storage_path ?? null,
      mimeType: asset?.mime_type ?? null,
      label: asset?.label ?? null,
    };
  });
  const built = buildLessonMaterials({
    locked: false,
    bodyHtml: (template as { body_html?: string } | null)?.body_html ?? "",
    blocks,
  });
  return withSignedLessonFiles(built, async (storagePath) => {
    const signed = await admin.storage.from(LEARNING_TASK_ASSET_BUCKET).createSignedUrl(storagePath, 300);
    if (signed.error || !signed.data?.signedUrl) return null;
    return signed.data.signedUrl;
  });
}
