import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentTemplateLibraryRow = {
  id: string;
  title: string;
  description: string;
  bodyHtml: string;
  updatedAt: string;
  assetCount: number;
  assets: {
    id: string;
    label: string;
    kind: "file" | "embed";
    mimeType: string | null;
    embedUrl: string | null;
  }[];
};

type TemplateRow = {
  id: string;
  title: string;
  description?: string | null;
  body_html: string;
  updated_at: string;
  content_template_assets: {
    id: string;
    label: string;
    kind: "file" | "embed";
    mime_type: string | null;
    embed_url: string | null;
  }[] | null;
};

export async function loadContentTemplateLibrary(
  supabase: SupabaseClient,
  limit = 30,
): Promise<ContentTemplateLibraryRow[]> {
  const { data } = await supabase
    .from("content_templates")
    .select("id, title, description, body_html, updated_at, content_template_assets(id, label, kind, mime_type, embed_url)")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as TemplateRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    bodyHtml: row.body_html,
    updatedAt: row.updated_at,
    assetCount: row.content_template_assets?.length ?? 0,
    assets: (row.content_template_assets ?? []).map((asset) => ({
      id: asset.id,
      label: asset.label,
      kind: asset.kind,
      mimeType: asset.mime_type,
      embedUrl: asset.embed_url,
    })),
  }));
}
