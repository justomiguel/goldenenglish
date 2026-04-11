import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const PER_PAGE = 1000;

/**
 * Fetches every Auth user by paging `auth.admin.listUsers` (max 1000 per request).
 */
export async function listAllAuthUsers(
  admin: SupabaseClient,
): Promise<{ users: User[]; error: Error | null }> {
  const users: User[] = [];
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) {
      return { users, error };
    }
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < PER_PAGE) break;
    page += 1;
  }

  return { users, error: null };
}
