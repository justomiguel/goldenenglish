import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { buildEventAdminEditHref } from "@/lib/events/buildEventAdminEditHref";

export async function resolveSessionEventAdminEditHref(
  supabase: SupabaseClient,
  locale: string,
  eventId: string,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) return null;

  return buildEventAdminEditHref(locale, eventId);
}
