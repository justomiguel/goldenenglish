import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Staff classroom assistants (`profiles.role = assistant`) use a dedicated dashboard
 * focused on section attendance. This does not apply to students with section assistant rows.
 */
export async function resolveStaffAssistantPortal(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return profile?.role === "assistant";
}
