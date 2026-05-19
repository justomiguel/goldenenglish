import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

/** Institution admin profile ids (service role); for messaging timeline labels when RLS hides admins. */
export async function loadAdminProfileIds(): Promise<ReadonlySet<string>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("id").eq("role", "admin").limit(500);
  if (error) {
    logSupabaseClientError("loadAdminProfileIds", error, {});
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.id as string));
}
