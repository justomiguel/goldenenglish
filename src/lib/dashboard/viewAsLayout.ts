import { portalAllowsActor } from "@/lib/dashboard/resolveDashboardActor";
import type { DashboardActor, ViewAsSubjectRole } from "@/lib/dashboard/viewAsTypes";
import { viewAsPortalHref } from "@/lib/dashboard/viewAsTypes";

export function viewAsPortalRedirect(
  locale: string,
  actor: DashboardActor,
  portal: ViewAsSubjectRole,
  access: {
    sessionProfileRole: string | null;
    teacherPortalAllowed: boolean;
    assistantPortalAllowed: boolean;
  },
): string | null {
  if (actor.redirectAdminEnded) {
    return `${viewAsPortalHref(locale, "admin")}?viewAs=ended`;
  }
  const allow = portalAllowsActor(portal, {
    sessionProfileRole: access.sessionProfileRole,
    isAdmin: actor.isAdmin,
    teacherPortalAllowed: access.teacherPortalAllowed,
    assistantPortalAllowed: access.assistantPortalAllowed,
    viewAs: actor.viewAs,
  });
  if (allow === "mismatch") return viewAsPortalHref(locale, "admin");
  if (allow === "deny") return `/${locale}/dashboard`;
  return null;
}

export function portalPageAllowsSession(
  sessionRole: string | null | undefined,
  expected: ViewAsSubjectRole,
  viewAs: DashboardActor["viewAs"],
): boolean {
  return sessionRole === expected || viewAs?.role === expected;
}

export function filterAccountItemsForViewAs<T extends { id: string; action?: string }>(
  items: readonly T[],
  viewAs: DashboardActor["viewAs"],
): T[] {
  if (!viewAs) return [...items];
  return items.filter((item) => item.action !== "signOut" && item.id !== "profile");
}
