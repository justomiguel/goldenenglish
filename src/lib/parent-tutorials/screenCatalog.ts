/**
 * Contextual “explain this screen” catalog for the parent/tutor portal.
 * Home is the only chrome-and-content tour; all others are content-only.
 */

export type ParentScreenTourId =
  | "parent-home"
  | "parent-calendar"
  | "parent-progress"
  | "parent-payments"
  | "parent-messages"
  | "parent-settings"
  | "parent-profile"
  | "parent-billing"
  | "parent-tasks"
  | "parent-assessments"
  | "parent-badges"
  | "parent-child-detail";

export type ParentScreenTourScope = "chrome-and-content" | "content-only";

/** Dictionary key under dashboard.parentHelpScreenTours.<metaKey> */
export type ParentScreenTourMetaKey =
  | "parentHome"
  | "parentCalendar"
  | "parentProgress"
  | "parentPayments"
  | "parentMessages"
  | "parentSettings"
  | "parentProfile"
  | "parentBilling"
  | "parentTasks"
  | "parentAssessments"
  | "parentBadges"
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
  /** Path under `/{locale}/dashboard/parent` (leading slash). Longer first. */
  parentSuffix: string;
  id: Exclude<ParentScreenTourId, "parent-home" | "parent-profile" | "parent-child-detail">;
  metaKey: Exclude<
    ParentScreenTourMetaKey,
    "parentHome" | "parentProfile" | "parentChildDetail"
  >;
};

const PARENT_CONTENT_ROUTES: readonly ContentRoute[] = [
  { parentSuffix: "/assessments", id: "parent-assessments", metaKey: "parentAssessments" },
  { parentSuffix: "/calendar", id: "parent-calendar", metaKey: "parentCalendar" },
  { parentSuffix: "/progress", id: "parent-progress", metaKey: "parentProgress" },
  { parentSuffix: "/payments", id: "parent-payments", metaKey: "parentPayments" },
  { parentSuffix: "/messages", id: "parent-messages", metaKey: "parentMessages" },
  { parentSuffix: "/settings", id: "parent-settings", metaKey: "parentSettings" },
  { parentSuffix: "/billing", id: "parent-billing", metaKey: "parentBilling" },
  { parentSuffix: "/tasks", id: "parent-tasks", metaKey: "parentTasks" },
  { parentSuffix: "/badges", id: "parent-badges", metaKey: "parentBadges" },
];

const CHILD_DETAIL_RE = /^\/[^/]+\/dashboard\/parent\/children\/[^/]+$/;

function parsePathAndQuery(pathname: string): { path: string; search: string } {
  const [pathPart, queryPart] = pathname.split("?", 2);
  return {
    path: stripTrailingSlash(pathPart ?? pathname),
    search: queryPart ?? "",
  };
}

export function parentChildDetailPath(locale: string, studentId: string): string {
  return `${parentHomePath(locale)}/children/${studentId}`;
}

/** Prefer child-detail URL segment; else first linked ward from layout. */
export function resolveParentTutorialStudentId(
  pathname: string,
  locale: string,
  fallbackStudentId?: string,
): string | undefined {
  const path = stripTrailingSlash(pathname.split("?")[0] ?? pathname);
  const prefix = `${parentHomePath(locale)}/children/`;
  if (path.startsWith(prefix)) {
    const segment = path.slice(prefix.length).split("/")[0];
    if (segment) return segment;
  }
  return fallbackStudentId;
}

export function parentScreenPath(
  locale: string,
  id: Exclude<ParentScreenTourId, "parent-home" | "parent-profile" | "parent-child-detail">,
): string {
  if (id === "parent-billing") {
    return `${parentHomePath(locale)}/payments?tab=fees`;
  }
  const row = PARENT_CONTENT_ROUTES.find((r) => r.id === id);
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
  if (CHILD_DETAIL_RE.test(path)) {
    return {
      id: "parent-child-detail",
      scope: "content-only",
      metaKey: "parentChildDetail",
    };
  }

  const base = parentHomePath(locale);
  if (path === `${base}/billing`) {
    return { id: "parent-billing", scope: "content-only", metaKey: "parentBilling" };
  }
  if (path === `${base}/payments`) {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "fees") {
      return { id: "parent-billing", scope: "content-only", metaKey: "parentBilling" };
    }
  }
  if (!path.startsWith(`${base}/`)) return null;

  for (const route of PARENT_CONTENT_ROUTES) {
    const full = `${base}${route.parentSuffix}`;
    if (path === full) {
      return { id: route.id, scope: "content-only", metaKey: route.metaKey };
    }
  }
  return null;
}

export function listParentScreenTourIds(): ParentScreenTourId[] {
  return [
    "parent-home",
    "parent-calendar",
    "parent-progress",
    "parent-payments",
    "parent-messages",
    "parent-settings",
    "parent-profile",
    "parent-billing",
    "parent-tasks",
    "parent-assessments",
    "parent-badges",
    "parent-child-detail",
  ];
}

export function listParentScreenTourMetaKeys(): ParentScreenTourMetaKey[] {
  return [
    "parentHome",
    "parentCalendar",
    "parentProgress",
    "parentPayments",
    "parentMessages",
    "parentSettings",
    "parentProfile",
    "parentBilling",
    "parentTasks",
    "parentAssessments",
    "parentBadges",
    "parentChildDetail",
  ];
}
