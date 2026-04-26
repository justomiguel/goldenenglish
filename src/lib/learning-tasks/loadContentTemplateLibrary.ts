import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

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
    storagePath: string | null;
  }[];
  blocks: ContentTemplateBlock[];
  blockCount: number;
};

export type ContentTemplateBlock = {
  id: string;
  kind: "text" | "file" | "video_embed" | "audio" | "image" | "pdf" | "quiz" | "external_link" | "divider";
  sortOrder: number;
  assetId: string | null;
  payload: Record<string, unknown>;
};

export type ContentTemplateListSelectRow = {
  id: string;
  title: string;
  description?: string | null;
  body_html: string | null;
  updated_at: string;
  content_template_assets: {
    id: string;
    label: string;
    kind: "file" | "embed";
    mime_type: string | null;
    embed_url: string | null;
    storage_path: string | null;
  }[] | null;
  content_template_blocks: { id: string }[] | null;
};

const CONTENT_TEMPLATE_LIBRARY_LIST_SELECT =
  "id, title, description, body_html, updated_at, content_template_assets(id, label, kind, mime_type, embed_url, storage_path), content_template_blocks(id)";

export const CONTENT_TEMPLATE_REPOSITORY_PAGE_SIZE = 20;

export function mapContentTemplateListRow(row: ContentTemplateListSelectRow): ContentTemplateLibraryRow {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    bodyHtml: row.body_html ?? "",
    updatedAt: row.updated_at,
    assetCount: row.content_template_assets?.length ?? 0,
    assets: (row.content_template_assets ?? []).map((asset) => ({
      id: asset.id,
      label: asset.label,
      kind: asset.kind,
      mimeType: asset.mime_type,
      embedUrl: asset.embed_url,
      storagePath: asset.storage_path,
    })),
    blocks: [],
    blockCount: row.content_template_blocks?.length ?? 0,
  };
}

export function clampContentTemplateRepositoryPage(page: number, totalCount: number, pageSize: number): number {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalCount) / pageSize));
  return Math.min(Math.max(1, page), totalPages);
}

export interface PaginatedContentTemplateLibraryParams {
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface PaginatedContentTemplateLibraryResult {
  rows: ContentTemplateLibraryRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function loadPaginatedContentTemplateLibrary(
  supabase: SupabaseClient,
  params: PaginatedContentTemplateLibraryParams = {},
): Promise<PaginatedContentTemplateLibraryResult> {
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? CONTENT_TEMPLATE_REPOSITORY_PAGE_SIZE));
  const rawPage = Math.max(1, Math.floor(params.page ?? 1));
  const q = (params.q ?? "").trim();

  let countQuery = supabase
    .from("content_templates")
    .select("id", { head: true, count: "exact" })
    .is("archived_at", null);

  let dataQuery = supabase
    .from("content_templates")
    .select(CONTENT_TEMPLATE_LIBRARY_LIST_SELECT)
    .is("archived_at", null);

  if (q) {
    const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    const pattern = `%${escaped}%`;
    const orFilter = `title.ilike.${pattern},description.ilike.${pattern}`;
    countQuery = countQuery.or(orFilter);
    dataQuery = dataQuery.or(orFilter);
  }

  const { count: totalCountRaw, error: countError } = await countQuery;
  if (countError) {
    logSupabaseClientError("loadPaginatedContentTemplateLibrary:count", countError, {});
  }
  const totalCount = totalCountRaw ?? 0;
  const page = clampContentTemplateRepositoryPage(rawPage, totalCount, pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await dataQuery.order("updated_at", { ascending: false }).range(from, to);
  if (error) {
    logSupabaseClientError("loadPaginatedContentTemplateLibrary:select", error, { page, pageSize });
    return { rows: [], totalCount, page, pageSize };
  }

  const rows = ((data ?? []) as ContentTemplateListSelectRow[]).map(mapContentTemplateListRow);
  return { rows, totalCount, page, pageSize };
}

type TemplateBlockRow = {
  id: string;
  kind: ContentTemplateBlock["kind"];
  sort_order: number;
  asset_id: string | null;
  payload: Record<string, unknown> | null;
};

export async function loadContentTemplateLibrary(
  supabase: SupabaseClient,
  limit = 30,
): Promise<ContentTemplateLibraryRow[]> {
  const { data } = await supabase
    .from("content_templates")
    .select(CONTENT_TEMPLATE_LIBRARY_LIST_SELECT)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as ContentTemplateListSelectRow[]).map(mapContentTemplateListRow);
}

export async function loadContentTemplateById(
  supabase: SupabaseClient,
  id: string,
): Promise<ContentTemplateLibraryRow | null> {
  const templatePromise = supabase
    .from("content_templates")
    .select(CONTENT_TEMPLATE_LIBRARY_LIST_SELECT)
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();
  const blocksPromise = supabase
    .from("content_template_blocks")
    .select("id, kind, sort_order, asset_id, payload")
    .eq("template_id", id)
    .order("sort_order", { ascending: true });
  const [{ data }, { data: blocksData }] = await Promise.all([templatePromise, blocksPromise]);

  if (!data) return null;
  const row = data as ContentTemplateListSelectRow;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    bodyHtml: row.body_html ?? "",
    updatedAt: row.updated_at,
    assetCount: row.content_template_assets?.length ?? 0,
    assets: (row.content_template_assets ?? []).map((asset) => ({
      id: asset.id,
      label: asset.label,
      kind: asset.kind,
      mimeType: asset.mime_type,
      embedUrl: asset.embed_url,
      storagePath: asset.storage_path,
    })),
    blocks: ((blocksData ?? []) as TemplateBlockRow[]).map((block) => ({
      id: block.id,
      kind: block.kind,
      sortOrder: block.sort_order,
      assetId: block.asset_id,
      payload: block.payload ?? {},
    })),
    blockCount: row.content_template_blocks?.length ?? 0,
  };
}
