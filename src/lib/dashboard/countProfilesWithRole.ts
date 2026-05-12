import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/** Bounded institution metadata read (service role); used when session RLS cannot see admin rows. */
export async function countProfilesWithRole(role: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { head: true, count: "exact" })
    .eq("role", role);
  if (error) {
    logSupabaseClientError("countProfilesWithRole", error, { role });
    return 0;
  }
  return count ?? 0;
}
