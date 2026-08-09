export interface ParentLegacySearchParams {
  studentId?: string;
  sectionId?: string;
  tab?: string;
}

/** Where each Progress hub tab ended up once the hub was split into routes. */
const TAB_DESTINATIONS: Record<string, string> = {
  exams: "/child/grades",
  assessments: "/child/grades",
  tasks: "/child/tasks",
  feedback: "/child/feedback",
  badges: "/child/badges",
};

/**
 * Builds a `/dashboard/parent` path that keeps whichever child and section the old
 * URL was pointing at, so a bookmark does not silently switch children on the way in.
 */
export function parentRedirectPath(
  locale: string,
  suffix: string,
  sp: ParentLegacySearchParams,
): string {
  const query = new URLSearchParams();
  if (typeof sp.studentId === "string" && sp.studentId) query.set("studentId", sp.studentId);
  if (typeof sp.sectionId === "string" && sp.sectionId) query.set("sectionId", sp.sectionId);
  const search = query.toString();
  return `/${locale}/dashboard/parent${suffix}${search ? `?${search}` : ""}`;
}

/** The Progress hub's `?tab=` becomes a route; an unknown tab lands on the child screen. */
export function parentProgressRedirectPath(
  locale: string,
  sp: ParentLegacySearchParams,
): string {
  const suffix =
    typeof sp.tab === "string" ? TAB_DESTINATIONS[sp.tab] ?? "/child" : "/child";
  return parentRedirectPath(locale, suffix, sp);
}
