export type AdminPwaTabId = "home" | "registrations" | "finance" | "people" | "more";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PEOPLE_SEGMENTS = ["/students", "/parents", "/teachers", "/users"] as const;

export function adminBasePath(locale: string): string {
  return `/${locale}/dashboard/admin`;
}

export function resolveAdminPwaTabActive(pathname: string, locale: string): AdminPwaTabId {
  const base = adminBasePath(locale);
  if (pathname === base || pathname === `${base}/`) return "home";
  if (pathname.startsWith(`${base}/registrations`)) return "registrations";
  if (pathname.startsWith(`${base}/finance`)) return "finance";
  if (PEOPLE_SEGMENTS.some((segment) => pathname.startsWith(`${base}${segment}`))) {
    return "people";
  }
  return "more";
}

/** Cohort collections deep-link when the current route is a cohort page. */
export function adminFinanceHrefForPathname(base: string, pathname: string): string {
  const defaultHref = `${base}/finance`;
  const academicPrefix = `${base}/academic/`;
  if (!pathname.startsWith(academicPrefix)) return defaultHref;

  const cohortId = pathname.slice(academicPrefix.length).split("/")[0] ?? "";
  if (!UUID_RE.test(cohortId)) return defaultHref;

  const params = new URLSearchParams({ tab: "collections", cohort: cohortId });
  return `${defaultHref}?${params.toString()}`;
}

export function formatAdminPwaBadgeCount(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}
