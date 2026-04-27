import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type GradingActorSession = {
  supabase: SupabaseClient;
  user: User;
  profileId: string;
  isAdmin: boolean;
};

/**
 * Teacher portal, assistants, or admin — anyone allowed to open the cohort rubric matrix
 * and persist grades per repo rules.
 */
export async function resolveGradingActorSession(): Promise<GradingActorSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (error || !profile?.id) return null;

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!allowed && !isAdmin) return null;

  return { supabase, user, profileId: profile.id as string, isAdmin };
}
