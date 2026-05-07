import type { SupabaseClient } from "@supabase/supabase-js";

const PER_PAGE = 1000;

/**
 * Pages Auth users until one matches `normalizedEmail` (trimmed, lowercased).
 * Use sparingly: worst case scans many pages when the user does not exist.
 */
export async function findAuthUserIdByNormalizedEmail(
  admin: SupabaseClient,
  normalizedEmail: string,
): Promise<{ userId: string | null; error: { message: string } | null }> {
  const target = normalizedEmail.trim().toLowerCase();
  if (!target) {
    return { userId: null, error: null };
  }

  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) {
      return { userId: null, error: { message: error.message } };
    }
    const batch = data?.users ?? [];
    for (const u of batch) {
      if ((u.email ?? "").trim().toLowerCase() === target) {
        return { userId: u.id, error: null };
      }
    }
    if (batch.length < PER_PAGE) break;
    page += 1;
  }
  return { userId: null, error: null };
}
