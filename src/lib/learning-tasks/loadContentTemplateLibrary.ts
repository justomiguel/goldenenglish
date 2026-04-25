import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentTemplateLibraryRow = {
  id: string;
  title: string;
  updatedAt: string;
  assetCount: number;
};

type TemplateRow = {
  id: string;
  title: string;
  updated_at: string;
  content_template_assets: { id: string }[] | null;
};

export async function loadContentTemplateLibrary(
  supabase: SupabaseClient,
  limit = 30,
): Promise<ContentTemplateLibraryRow[]> {
  const { data } = await supabase
    .from("content_templates")
    .select("id, title, updated_at, content_template_assets(id)")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as TemplateRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    assetCount: row.content_template_assets?.length ?? 0,
  }));
}
