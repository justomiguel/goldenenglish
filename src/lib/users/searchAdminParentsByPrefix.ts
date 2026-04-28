import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminParentSearchHit } from "@/types/adminUsers";
import { buildIlikePrefixPattern } from "@/lib/users/profileSearchPrefix";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

const INITIAL_PAGE_SIZE = 30;
const PREFIX_PAGE_SIZE = 30;

/**
 * Admin-only: parent/guardian profiles by alphabetical window (empty query) or prefix
 * on first name, last name, or identity document.
 */
export async function searchAdminParentsByPrefix(
  supabase: SupabaseClient,
  rawQuery: string,
): Promise<AdminParentSearchHit[]> {
  const q = rawQuery.trim();
  if (q.length === 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("role", "parent")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .limit(INITIAL_PAGE_SIZE);
    if (error || !data) return [];
    return data.map((p) => ({
      id: String(p.id),
      label: formatProfileSnakeSurnameFirst(p as { first_name: string | null; last_name: string | null }),
    }));
  }

  const pat = buildIlikePrefixPattern(q);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("role", "parent")
    .or(`first_name.ilike.${pat},last_name.ilike.${pat},dni_or_passport.ilike.${pat}`)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .limit(PREFIX_PAGE_SIZE);

  if (error || !data) return [];
  return data.map((p) => ({
    id: String(p.id),
    label: formatProfileSnakeSurnameFirst(p as { first_name: string | null; last_name: string | null }),
  }));
}
