import { revalidatePath, updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_THEME_ACTIVE_CACHE_TAG } from "@/types/theming";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logSupabaseError } from "@/lib/logging/serverActionLog";

/** Result shape shared by every site theme action. Stable codes (not localized
 *  copy) so the client renders messages from the dictionary, never from the
 *  server, per `09-i18n-copy.mdc`. */
export type SiteThemeActionResult =
  | { ok: true; id?: string }
  | { ok: false; code: SiteThemeActionErrorCode };

export type SiteThemeActionErrorCode =
  | "invalid_input"
  | "forbidden"
  | "slug_taken"
  | "not_found"
  | "already_active"
  | "archived_cannot_activate"
  | "active_cannot_archive"
  | "system_default_cannot_archive"
  | "persist_failed";

export const PG_UNIQUE_VIOLATION = "23505";

/** Shared post-mutation invalidation. Templates can be edited at any time and
 *  any change to the **active** template must clear the cached snapshot used
 *  by the public layout (`loadActiveTheme`), per the runtime theming ADR. */
export function revalidateSiteThemeSurfaces(locale: string): void {
  updateTag(SITE_THEME_ACTIVE_CACHE_TAG);
  revalidatePath(`/${locale}/dashboard/admin/cms`);
  revalidatePath(`/${locale}/dashboard/admin/cms/templates`);
  revalidatePath(`/${locale}`);
}

export type AdminContext = Awaited<ReturnType<typeof assertAdmin>>;

/** Centralizes the `assertAdmin()` try/catch boilerplate so each action stays
 *  focused on its own validation + persistence path. Returning a discriminated
 *  union keeps the call site type-safe without throwing across the boundary. */
export async function resolveAdminContext(): Promise<
  { ok: true; admin: AdminContext } | { ok: false; code: "forbidden" }
> {
  try {
    const admin = await assertAdmin();
    return { ok: true, admin };
  } catch {
    return { ok: false, code: "forbidden" };
  }
}

export interface FetchedSiteTheme {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  is_system_default: boolean | null;
  archived_at: string | null;
  template_kind: unknown;
  properties: unknown;
  content: unknown;
  blocks: unknown;
}

export async function fetchSiteThemeById(
  supabase: SupabaseClient,
  id: string,
): Promise<FetchedSiteTheme | null> {
  const { data, error } = await supabase
    .from("site_themes")
    .select(
      "id, slug, name, is_active, is_system_default, archived_at, template_kind, properties, content, blocks",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) logSupabaseError("siteThemeActions:fetchTheme", error);
  return (data as FetchedSiteTheme | null) ?? null;
}
