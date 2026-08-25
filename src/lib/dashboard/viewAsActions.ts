"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { loadPaginatedAdminUsers } from "@/lib/dashboard/loadPaginatedAdminUsers";
import { ROLE_FILTER_ALL } from "@/lib/dashboard/adminUsersTableHelpers";
import { formatProfileNameGivenFirst } from "@/lib/profile/formatProfileDisplayName";
import { startViewAsDecision, type ViewAsProfileRow } from "@/lib/dashboard/resolveDashboardActor";
import { clearViewAsCookie, writeViewAsCookie } from "@/lib/dashboard/getDashboardActor";
import { viewAsPortalHref, type ViewAsSelectorRole } from "@/lib/dashboard/viewAsTypes";

export type ViewAsPersonHit = {
  id: string;
  displayName: string;
  role: string;
  email: string;
};

export async function startViewAsAction(
  locale: string,
  userId: string,
): Promise<{ href: string; started: boolean }> {
  const adminHref = viewAsPortalHref(locale, "admin");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { href: `/${locale}/login`, started: false };

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, role, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  const subject = (data as ViewAsProfileRow | null) ?? null;
  const decision = startViewAsDecision({ sessionUserId: user.id, isAdmin, subject });

  if (decision.kind === "reject") {
    await clearViewAsCookie();
    return { href: adminHref, started: false };
  }
  if (decision.kind === "own") {
    await clearViewAsCookie();
    return { href: viewAsPortalHref(locale, decision.role), started: false };
  }

  const wrote = await writeViewAsCookie(decision.subject.id);
  if (!wrote) {
    await clearViewAsCookie();
    return { href: adminHref, started: false };
  }
  return { href: viewAsPortalHref(locale, decision.subject.role), started: true };
}

export async function clearViewAsAction(locale: string): Promise<{ href: string }> {
  await clearViewAsCookie();
  return { href: viewAsPortalHref(locale, "admin") };
}

export async function openOwnTeacherAction(locale: string): Promise<{ href: string }> {
  await clearViewAsCookie();
  return { href: viewAsPortalHref(locale, "teacher") };
}

export async function searchViewAsPeopleAction(
  q: string,
  role: ViewAsSelectorRole,
): Promise<{ rows: ViewAsPersonHit[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { rows: [] };
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) return { rows: [] };

  const admin = createAdminClient();
  const result = await loadPaginatedAdminUsers(admin, "—", {
    page: 1,
    pageSize: 8,
    q,
    role: role === "all" ? ROLE_FILTER_ALL : role,
    sort: "name",
    dir: "asc",
  });

  return {
    rows: result.rows.map((row) => ({
      id: row.id,
      displayName: formatProfileNameGivenFirst(row.firstName, row.lastName, row.email),
      role: row.role,
      email: row.email,
    })),
  };
}
