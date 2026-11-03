import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeHashtag } from "@/lib/courses/catalogHashtag";
import type { CatalogMaterialKind } from "@/lib/courses/catalogMaterial";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export const CONTENT_TEMPLATE_LIBRARY_LIST_SELECT =
  "id, title, description, body_html, updated_at, content_template_assets(id, label, kind, mime_type, embed_url, storage_path), content_template_blocks(id)";

export function contentTemplateCatalogSelect(input: { tag: boolean; material: boolean }): {
  list: string;
  count: string;
} {
  const list = input.material
    ? CONTENT_TEMPLATE_LIBRARY_LIST_SELECT.replace("content_template_blocks(id)", "content_template_blocks!inner(id, kind)")
    : CONTENT_TEMPLATE_LIBRARY_LIST_SELECT;
  const withTag = input.tag ? `${list}, content_template_hashtags!inner(hashtag_id)` : list;
  const countParts = ["id"];
  if (input.tag) countParts.push("content_template_hashtags!inner(hashtag_id)");
  if (input.material) countParts.push("content_template_blocks!inner(kind)");
  return { list: withTag, count: countParts.join(", ") };
}

export type ContentTemplateCatalogFilter =
  | { empty: true }
  | { empty: false; hashtagId: string | null; material: CatalogMaterialKind | null; list: string; count: string };

export async function resolveContentTemplateCatalogFilter(
  supabase: SupabaseClient,
  input: { tag?: string; material?: CatalogMaterialKind | null },
): Promise<ContentTemplateCatalogFilter> {
  const rawTag = input.tag?.trim() ?? "";
  let hashtagId: string | null = null;
  if (rawTag) {
    const label = normalizeHashtag(rawTag);
    if (!label) return { empty: true };
    const { data, error } = await supabase.from("catalog_hashtags").select("id").eq("label", label).maybeSingle();
    if (error) {
      logSupabaseClientError("contentTemplateCatalog:hashtag", error, {});
      return { empty: true };
    }
    if (!data?.id) return { empty: true };
    hashtagId = String(data.id);
  }
  const material = input.material ?? null;
  return {
    empty: false,
    hashtagId,
    material,
    ...contentTemplateCatalogSelect({ tag: Boolean(hashtagId), material: Boolean(material) }),
  };
}

export function applyContentTemplateCatalogFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  filter: { hashtagId: string | null; material: string | null },
): T {
  let next = query;
  if (filter.hashtagId) next = next.eq("content_template_hashtags.hashtag_id", filter.hashtagId);
  if (filter.material) next = next.eq("content_template_blocks.kind", filter.material);
  return next;
}
