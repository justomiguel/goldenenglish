import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { resolveDashboardActorState, type ViewAsProfileRow } from "@/lib/dashboard/resolveDashboardActor";
import {
  VIEW_AS_COOKIE_NAME,
  VIEW_AS_COOKIE_OPTIONS,
  signViewAsCookie,
  verifyViewAsCookie,
} from "@/lib/dashboard/viewAsCookie";
import type { DashboardActor } from "@/lib/dashboard/viewAsTypes";

async function loadSubject(userId: string): Promise<ViewAsProfileRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  return (data as ViewAsProfileRow | null) ?? null;
}

export const getDashboardActor = cache(async (): Promise<DashboardActor | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  const jar = await cookies();
  const cookieValue = jar.get(VIEW_AS_COOKIE_NAME)?.value ?? null;
  const payload = verifyViewAsCookie(cookieValue);
  const subject = payload ? await loadSubject(payload.userId) : null;
  const state = resolveDashboardActorState({
    sessionUserId: user.id,
    isAdmin,
    cookieValue,
    subject,
  });
  return { sessionUserId: user.id, isAdmin, ...state };
});

export async function writeViewAsCookie(userId: string): Promise<boolean> {
  const token = signViewAsCookie(userId);
  if (!token) return false;
  const jar = await cookies();
  jar.set(VIEW_AS_COOKIE_NAME, token, VIEW_AS_COOKIE_OPTIONS);
  return true;
}

export async function clearViewAsCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(VIEW_AS_COOKIE_NAME);
}

export async function syncViewAsCookie(actor: DashboardActor): Promise<void> {
  if (actor.clearCookie || actor.redirectAdminEnded) {
    await clearViewAsCookie();
  }
}
