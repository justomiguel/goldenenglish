export const VIEW_AS_SUBJECT_ROLES = ["teacher", "student", "parent", "assistant"] as const;

export type ViewAsSubjectRole = (typeof VIEW_AS_SUBJECT_ROLES)[number];

export type ViewAsSelectorRole = ViewAsSubjectRole | "admin" | "all";

export type ViewAsSubject = {
  id: string;
  displayName: string;
  role: ViewAsSubjectRole;
};

export type DashboardActor = {
  sessionUserId: string;
  viewerId: string;
  isAdmin: boolean;
  viewAs: ViewAsSubject | null;
  /** Tampered / missing subject / excluded / admin subject — layouts clear cookie and toast. */
  redirectAdminEnded: boolean;
  /** Valid cookie that must still be dropped (self-pick). */
  clearCookie: boolean;
};

export function isViewAsSubjectRole(role: string): role is ViewAsSubjectRole {
  return (VIEW_AS_SUBJECT_ROLES as readonly string[]).includes(role);
}

export function viewAsPortalHref(locale: string, role: ViewAsSubjectRole | "admin"): string {
  return `/${locale}/dashboard/${role === "admin" ? "admin" : role}`;
}
