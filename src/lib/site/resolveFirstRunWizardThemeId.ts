import { createAnonReadOnlyClient } from "@/lib/supabase/anon";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { getSiteBrandThemeSlug } from "@/lib/theme/siteBrandThemeSlug";

/**
 * Theme row used by `/setup/first-run` when saving wizard data. Prefer
 * `SITE_BRAND_THEME_SLUG` (service role) so the same row drives public brand
 * and wizard output; otherwise the single `is_active` theme (anon).
 */
export async function resolveFirstRunWizardThemeId(): Promise<string | null> {
  const slug = getSiteBrandThemeSlug();
  if (slug) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("site_themes")
        .select("id")
        .eq("slug", slug)
        .is("archived_at", null)
        .maybeSingle();
      if (!error && data?.id) return String(data.id);
    } catch (err) {
      logServerException("resolveFirstRunWizardThemeId:admin", err);
    }
  }

  const anon = createAnonReadOnlyClient();
  if (!anon) return null;
  const { data, error } = await anon
    .from("site_themes")
    .select("id")
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();
  if (error || !data?.id) return null;
  return String(data.id);
}
