import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getDashboardActor } from "@/lib/dashboard/getDashboardActor";
import { loadParentFocusCatalog } from "@/lib/parent/loadParentFocusCatalog";
import { resolveParentFocus } from "@/lib/parent/resolveParentFocus";
import type { ParentFocusCatalog, ResolvedParentFocus } from "@/lib/parent/parentFocusTypes";

export interface ParentChildContext {
  supabase: SupabaseClient;
  userId: string;
  focusCatalog: ParentFocusCatalog;
  focus: ResolvedParentFocus;
}

export interface ParentChildSearchParams {
  studentId?: string;
  sectionId?: string;
}

/**
 * Auth plus active-child resolution, shared by every `/parent/child/*` route.
 * The role check lives in the layout; repeating it here would double the query.
 */
export async function loadParentChildContext(
  locale: string,
  routePath: string,
  sp: ParentChildSearchParams,
): Promise<ParentChildContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent${routePath}`);

  const actor = await getDashboardActor();
  const viewerId = actor?.viewerId ?? user.id;
  const focusCatalog = await loadParentFocusCatalog(supabase, viewerId);
  const focus = resolveParentFocus(focusCatalog, {
    studentId: typeof sp.studentId === "string" ? sp.studentId : null,
    sectionId: typeof sp.sectionId === "string" ? sp.sectionId : null,
  });

  return { supabase, userId: viewerId, focusCatalog, focus };
}
