import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getDashboardActor } from "@/lib/dashboard/getDashboardActor";
import { portalPageAllowsSession } from "@/lib/dashboard/viewAsLayout";
import type { DashboardActor, ViewAsSubjectRole } from "@/lib/dashboard/viewAsTypes";

export async function requirePortalPageActor(
  locale: string,
  portal: ViewAsSubjectRole,
  loginNext?: string,
): Promise<{
  supabase: SupabaseClient;
  user: { id: string };
  actor: DashboardActor | null;
  viewerId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=${loginNext ?? `/${locale}/dashboard/${portal}`}`);
  }

  const actor = await getDashboardActor();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!portalPageAllowsSession(profile?.role, portal, actor?.viewAs ?? null)) {
    redirect(`/${locale}/dashboard`);
  }

  return { supabase, user, actor, viewerId: actor?.viewerId ?? user.id };
}
