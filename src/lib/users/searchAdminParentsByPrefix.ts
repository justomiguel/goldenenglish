import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminParentSearchHit } from "@/types/adminUsers";
import { looksLikeFullEmailQuery } from "@/lib/dashboard/buildAdminUsersProfileOrFilter";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";
import {
  buildIlikePrefixPattern,
  personProfileMatchPrefix,
} from "@/lib/users/profileSearchPrefix";

const INITIAL_PAGE_SIZE = 30;
const PREFIX_PAGE_SIZE = 30;
/** Wider DB window before in-memory full-name / surname-first prefix filter. */
const PREFIX_FETCH_SIZE = 100;

type ParentRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
  dni_or_passport?: string | null;
};

function mapHit(p: ParentRow): AdminParentSearchHit {
  return {
    id: String(p.id),
    label: formatProfileSnakeSurnameFirst(p),
  };
}

/**
 * PostgREST `.or()` fragments: full-query prefixes plus per-token name prefixes
 * so multi-word queries can retrieve candidates for `personProfileMatchPrefix`.
 */
export function buildAdminParentsPrefixOrFilter(
  rawQuery: string,
  emailMatchUserId: string | null = null,
): string {
  const q = rawQuery.trim();
  const tokens = q.split(/\s+/).filter(Boolean);
  const parts: string[] = [];

  const fullPat = buildIlikePrefixPattern(q);
  parts.push(`first_name.ilike.${fullPat}`);
  parts.push(`last_name.ilike.${fullPat}`);
  parts.push(`dni_or_passport.ilike.${fullPat}`);

  if (tokens.length > 1) {
    for (const token of tokens) {
      const pat = buildIlikePrefixPattern(token);
      parts.push(`first_name.ilike.${pat}`);
      parts.push(`last_name.ilike.${pat}`);
    }
  }

  if (emailMatchUserId) {
    parts.push(`id.eq.${emailMatchUserId}`);
  }

  return parts.join(",");
}

/**
 * Admin-only: parent/guardian profiles by alphabetical window (empty query) or prefix
 * on first name, last name, identity document, full-name / surname-first prefixes,
 * or exact login email (via Auth lookup).
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
    return data.map((p) => mapHit(p as ParentRow));
  }

  let emailMatchUserId: string | null = null;
  if (looksLikeFullEmailQuery(q)) {
    const { userId } = await findAuthUserIdByNormalizedEmail(supabase, q);
    emailMatchUserId = userId;
  }

  const filter = buildAdminParentsPrefixOrFilter(q, emailMatchUserId);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, dni_or_passport")
    .eq("role", "parent")
    .or(filter)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .limit(PREFIX_FETCH_SIZE);

  if (error || !data) return [];

  return (data as ParentRow[])
    .filter((p) => {
      if (emailMatchUserId !== null && String(p.id) === emailMatchUserId) {
        return true;
      }
      return personProfileMatchPrefix(
        {
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          dni_or_passport: p.dni_or_passport,
        },
        q,
      );
    })
    .slice(0, PREFIX_PAGE_SIZE)
    .map(mapHit);
}
