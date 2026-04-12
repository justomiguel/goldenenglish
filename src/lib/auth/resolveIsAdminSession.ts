import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether the signed-in user is an admin. Uses profile row first, then
 * `is_current_user_admin` (SECURITY DEFINER) so detection matches RLS helpers.
 */
export async function resolveIsAdminSession(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") {
    return true;
  }

  const { data: rpcOk, error } = await supabase.rpc("is_current_user_admin");
  if (error || rpcOk == null) {
    return false;
  }
  return rpcOk === true;
}
