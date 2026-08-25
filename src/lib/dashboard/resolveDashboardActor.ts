import { formatProfileSnakeGivenFirst } from "@/lib/profile/formatProfileDisplayName";
import {
  ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS,
  ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE,
} from "@/lib/dashboard/adminUsersDirectoryExclusions";
import { verifyViewAsCookie } from "@/lib/dashboard/viewAsCookie";
import {
  isViewAsSubjectRole,
  type DashboardActor,
  type ViewAsSubject,
  type ViewAsSubjectRole,
} from "@/lib/dashboard/viewAsTypes";

export type ViewAsProfileRow = {
  id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
};

export function isExcludedViewAsProfile(profile: ViewAsProfileRow): boolean {
  if (profile.role === ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE) return true;
  return (ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS as readonly string[]).includes(profile.id);
}

export function subjectFromProfile(profile: ViewAsProfileRow): ViewAsSubject | null {
  if (!isViewAsSubjectRole(profile.role) || isExcludedViewAsProfile(profile)) return null;
  return {
    id: profile.id,
    displayName: formatProfileSnakeGivenFirst(profile, profile.id),
    role: profile.role,
  };
}

export function resolveDashboardActorState(input: {
  sessionUserId: string;
  isAdmin: boolean;
  cookieValue: string | null;
  subject: ViewAsProfileRow | null;
}): Omit<DashboardActor, "sessionUserId" | "isAdmin"> {
  const empty = {
    viewerId: input.sessionUserId,
    viewAs: null as ViewAsSubject | null,
    redirectAdminEnded: false,
    clearCookie: false,
  };

  if (!input.cookieValue) return empty;
  if (!input.isAdmin) return empty;

  const payload = verifyViewAsCookie(input.cookieValue);
  if (!payload) {
    return { ...empty, clearCookie: true, redirectAdminEnded: true };
  }

  const subject = input.subject;
  if (!subject || subject.id !== payload.userId || isExcludedViewAsProfile(subject)) {
    return { ...empty, clearCookie: true, redirectAdminEnded: true };
  }

  if (subject.id === input.sessionUserId) {
    return { ...empty, clearCookie: true };
  }

  if (subject.role === "admin") {
    return { ...empty, clearCookie: true, redirectAdminEnded: true };
  }

  const viewAs = subjectFromProfile(subject);
  if (!viewAs) {
    return { ...empty, clearCookie: true, redirectAdminEnded: true };
  }

  return {
    viewerId: viewAs.id,
    viewAs,
    redirectAdminEnded: false,
    clearCookie: false,
  };
}

export function portalAllowsActor(
  portal: ViewAsSubjectRole,
  input: {
    sessionProfileRole: string | null;
    isAdmin: boolean;
    teacherPortalAllowed: boolean;
    assistantPortalAllowed: boolean;
    viewAs: ViewAsSubject | null;
  },
): "allow" | "mismatch" | "deny" {
  if (input.viewAs) {
    return input.viewAs.role === portal ? "allow" : "mismatch";
  }

  if (portal === "teacher") return input.teacherPortalAllowed ? "allow" : "deny";
  if (portal === "assistant") return input.assistantPortalAllowed ? "allow" : "deny";
  if (portal === "student") return input.sessionProfileRole === "student" ? "allow" : "deny";
  if (portal === "parent") return input.sessionProfileRole === "parent" ? "allow" : "deny";
  return "deny";
}

export function startViewAsDecision(input: {
  sessionUserId: string;
  isAdmin: boolean;
  subject: ViewAsProfileRow | null;
}): { kind: "set"; subject: ViewAsSubject } | { kind: "own"; role: ViewAsSubjectRole | "admin" } | { kind: "reject" } {
  if (!input.isAdmin) return { kind: "reject" };
  if (!input.subject) return { kind: "reject" };
  if (input.subject.id === input.sessionUserId) {
    return { kind: "own", role: input.subject.role === "teacher" ? "teacher" : "admin" };
  }
  if (input.subject.role === "admin") return { kind: "own", role: "admin" };
  const subject = subjectFromProfile(input.subject);
  if (!subject) return { kind: "reject" };
  return { kind: "set", subject };
}
