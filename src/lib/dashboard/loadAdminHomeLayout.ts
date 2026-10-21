import type { SupabaseClient } from "@supabase/supabase-js";
import {
  factoryAdminHomeLayout,
  readAdminHomeLayout,
  type AdminHomeLayout,
} from "@/lib/dashboard/adminHomeLayout";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function loadAdminHomeLayout(
  supabase: SupabaseClient,
  profileId: string,
  options: { shopEnabled: boolean },
): Promise<AdminHomeLayout> {
  const { data, error } = await supabase
    .from("admin_home_layouts")
    .select("layout")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("adminHomeLayout.load", error, { profileId });
    return factoryAdminHomeLayout(options);
  }
  return readAdminHomeLayout(data?.layout, options);
}
