import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerWarn } from "@/lib/logging/serverActionLog";

export async function hasPublishedThemeDocument(
  client: SupabaseClient,
  siteThemeId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("theme_documents")
    .select("id")
    .eq("site_theme_id", siteThemeId)
    .eq("status", "published")
    .limit(1);
  if (error) {
    await logServerWarn("cms.legacyEditor", { code: "theme_document_lookup_failed", siteThemeId });
    return false;
  }
  return (data?.length ?? 0) > 0;
}
