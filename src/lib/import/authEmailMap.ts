import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { listAllAuthUsers } from "@/lib/supabase/listAllAuthUsers";

export function buildEmailToUserIdMap(users: User[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const u of users) {
    const e = u.email?.trim().toLowerCase();
    if (e) m.set(e, u.id);
  }
  return m;
}

export async function loadAuthEmailMap(admin: SupabaseClient): Promise<Map<string, string>> {
  const { users, error } = await listAllAuthUsers(admin);
  if (error) throw error;
  return buildEmailToUserIdMap(users);
}
