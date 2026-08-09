/**
 * Contextual “explain this screen” catalog for the parent/tutor portal.
 * Home is the only chrome-and-content tour; all others are content-only.
 */

export type ParentScreenTourId =
  | "parent-home"
  | "parent-calendar"
  | "parent-child"
  | "parent-attendance"
  | "parent-grades"
  | "parent-tasks"
  | "parent-feedback"
  | "parent-badges"
  | "parent-payments"
  | "parent-messages"
  | "parent-account"
  | "parent-profile"
  | "parent-billing"
  | "parent-child-detail";

export type ParentScreenTourScope = "chrome-and-content" | "content-only";

/** Dictionary key under dashboard.parentHelpScreenTours.<metaKey> */
export type ParentScreenTourMetaKey =
  | "parentHome"
  | "parentCalendar"
  | "parentChild"
  | "parentAttendance"
  | "parentGrades"
  | "parentTasks"
  | "parentFeedback"
  | "parentBadges"
  | "parentPayments"
  | "parentMessages"
  | "parentAccount"
  | "parentProfile"
  | "parentBilling"
  | "parentChildDetail";

export type ParentScreenTourMatch = {
  id: ParentScreenTourId;
  scope: ParentScreenTourScope;
  metaKey: ParentScreenTourMetaKey;
};

function stripTrailingSlash(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function parentHomePath(locale: string): string {
  return `/${locale}/dashboard/parent`;
}

export function parentProfilePath(locale: string): string {
  return `/${locale}/dashboard/profile`;
}

type ContentRoute = {
  /** Path under `/{locale}/dashboard/parent` (leading slash). */
  parentSuffix: string;
  id: Exclude<ParentScreenTourId, "parent-home" | "parent-profile">;
  metaKey: Exclude<ParentScreenTourMetaKey, "parentHome" | "parentProfile">;
};

/**
 * One row per real route. The child sections are nested paths, so the resolver
 * matches on exact equality and never inherits a parent's tour.
 */
const PARENT_CONTENT_ROUTES: readonly ContentRoute[] = [
  { parentSuffix: "/calendar", id: "parent-calendar", metaKey: "parentCalendar" },
  { parentSuffix: "/child", id: "parent-child", metaKey: "parentChild" },
  { parentSuffix: "/child/attendance", id: "parent-attendance", metaKey: "parentAttendance" },
  { parentSuffix: "/child/grades", id: "parent-grades", metaKey: "parentGrades" },
  { parentSuffix: "/child/tasks", id: "parent-tasks", metaKey: "parentTasks" },
  { parentSuffix: "/child/feedback", id: "parent-feedback", metaKey: "parentFeedback" },
  { parentSuffix: "/child/badges", id: "parent-badges", metaKey: "parentBadges" },
  { parentSuffix: "/child/edit", id: "parent-child-detail", metaKey: "parentChildDetail" },
  { parentSuffix: "/payments", id: "parent-payments", metaKey: "parentPayments" },
  { parentSuffix: "/messages", id: "parent-messages", metaKey: "parentMessages" },
  { parentSuffix: "/account", id: "parent-account", metaKey: "parentAccount" },
  { parentSuffix: "/billing", id: "parent-billing", metaKey: "parentBilling" },
];

function parsePathAndQuery(pathname: string): { path: string; search: string } {
  const [pathPart, queryPart] = pathname.split("?", 2);
  return {
    path: stripTrailingSlash(pathPart ?? pathname),
    search: queryPart ?? "",
  };
}

export function parentChildDetailPath(locale: string, studentId: string): string {
  return `${parentHomePath(locale)}/child/edit?studentId=${studentId}`;
}

/** Prefer the `?studentId` the URL is focused on; else the first linked ward. */
export function resolveParentTutorialStudentId(
  pathname: string,
  locale: string,
  fallbackStudentId?: string,
): string | undefined {
  const [, search] = pathname.split("?", 2);
  const fromQuery = new URLSearchParams(search ?? "").get("studentId");
  if (fromQuery) return fromQuery;
  return fallbackStudentId;
}

export function parentScreenPath(
  locale: string,
  id: Exclude<ParentScreenTourId, "parent-home" | "parent-profile">,
): string {
  if (id === "parent-billing") {
    return `${parentHomePath(locale)}/payments?tab=fees`;
  }
  const row = PARENT_CONTENT_ROUTES.find((route) => route.id === id);
  if (!row) throw new Error(`Unknown parent screen tour id: ${id}`);
  return `${parentHomePath(locale)}${row.parentSuffix}`;
}

export function resolveParentScreenTour(
  pathname: string,
  locale: string,
): ParentScreenTourMatch | null {
  const { path, search } = parsePathAndQuery(pathname);
  if (path === parentHomePath(locale)) {
    return { id: "parent-home", scope: "chrome-and-content", metaKey: "parentHome" };
  }
  if (path === parentProfilePath(locale)) {
    return { id: "parent-profile", scope: "content-only", metaKey: "parentProfile" };
  }

  const base = parentHomePath(locale);
  if (path === `${base}/payments`) {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "fees") {
      return { id: "parent-billing", scope: "content-only", metaKey: "parentBilling" };
    }
  }
  if (!path.startsWith(`${base}/`)) return null;

  for (const route of PARENT_CONTENT_ROUTES) {
    if (path === `${base}${route.parentSuffix}`) {
      return { id: route.id, scope: "content-only", metaKey: route.metaKey };
    }
  }
  return null;
}

export function listParentScreenTourIds(): ParentScreenTourId[] {
  return [
    "parent-home",
    "parent-calendar",
    "parent-child",
    "parent-attendance",
    "parent-grades",
    "parent-tasks",
    "parent-feedback",
    "parent-badges",
    "parent-payments",
    "parent-messages",
    "parent-account",
    "parent-profile",
    "parent-billing",
    "parent-child-detail",
  ];
}

export function listParentScreenTourMetaKeys(): ParentScreenTourMetaKey[] {
  return [
    "parentHome",
    "parentCalendar",
    "parentChild",
    "parentAttendance",
    "parentGrades",
    "parentTasks",
    "parentFeedback",
    "parentBadges",
    "parentPayments",
    "parentMessages",
    "parentAccount",
    "parentProfile",
    "parentBilling",
    "parentChildDetail",
  ];
}
