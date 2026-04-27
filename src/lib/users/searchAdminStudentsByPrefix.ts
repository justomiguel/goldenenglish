import type { SupabaseClient } from "@supabase/supabase-js";
import { buildIlikePrefixPattern } from "@/lib/users/profileSearchPrefix";

export type AdminStudentSearchHit = {
  id: string;
  label: string;
  role: string;
};

const INITIAL_PAGE_SIZE = 30;
const PREFIX_PAGE_SIZE = 30;

/**
 * Admin-only: students by alphabetical window (empty query) or prefix on first name,
 * last name, or identity document (accent-sensitive via DB collation; wildcards escaped).
 */
export async function searchAdminStudentsByPrefix(
  supabase: SupabaseClient,
  rawQuery: string,
): Promise<AdminStudentSearchHit[]> {
  const q = rawQuery.trim();
  if (q.length === 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("role", "student")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .limit(INITIAL_PAGE_SIZE);
    if (error || !data) return [];
    return data.map((p) => ({
      id: p.id as string,
      label: `${p.first_name} ${p.last_name}`.trim(),
      role: p.role as string,
    }));
  }

  const pat = buildIlikePrefixPattern(q);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("role", "student")
    .or(`first_name.ilike.${pat},last_name.ilike.${pat},dni_or_passport.ilike.${pat}`)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .limit(PREFIX_PAGE_SIZE);

  if (error || !data) return [];
  return data.map((p) => ({
    id: p.id as string,
    label: `${p.first_name} ${p.last_name}`.trim(),
    role: p.role as string,
  }));
}
