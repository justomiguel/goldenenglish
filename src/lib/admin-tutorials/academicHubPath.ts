const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function academicHubPath(locale: string): string {
  return `/${locale}/dashboard/admin/academic`;
}

export function academicCohortDetailPath(locale: string, cohortId: string): string {
  return `${academicHubPath(locale)}/${cohortId}`;
}

export function academicCohortSectionsPath(locale: string, cohortId: string): string {
  return `${academicCohortDetailPath(locale, cohortId)}?tab=sections`;
}

function stripTrailingSlash(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function isAcademicHubPath(pathname: string, locale: string): boolean {
  return stripTrailingSlash(pathname) === academicHubPath(locale);
}

export function isAcademicCohortDetailPath(pathname: string, locale: string): boolean {
  const base = academicHubPath(locale);
  const normalized = stripTrailingSlash(pathname);
  if (!normalized.startsWith(`${base}/`)) return false;
  const rest = normalized.slice(base.length + 1);
  const segment = rest.split("/")[0] ?? "";
  if (!UUID_RE.test(segment)) return false;
  // Exact cohort root or nested under that cohort (tabs share same shell)
  return rest === segment || rest.startsWith(`${segment}/`);
}

/** Section detail under a cohort (excludes nested routes like `/attendance`). */
export function isAcademicSectionDetailPath(pathname: string, locale: string): boolean {
  const base = academicHubPath(locale);
  const normalized = stripTrailingSlash(pathname);
  if (!normalized.startsWith(`${base}/`)) return false;
  const rest = normalized.slice(base.length + 1);
  const parts = rest.split("/").filter(Boolean);
  if (parts.length !== 2) return false;
  return UUID_RE.test(parts[0]!) && UUID_RE.test(parts[1]!);
}
