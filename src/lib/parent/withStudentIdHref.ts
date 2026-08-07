/**
 * Appends `?studentId=<value>` to `href` when `studentId` is non-empty and
 * `href` does not already carry a `studentId` parameter. Pure; no DOM, no router.
 *
 * Returns `href` unchanged when:
 * - `studentId` is null or empty
 * - `href` already contains `studentId=`
 */
export function withStudentIdHref(href: string, studentId: string | null): string {
  if (!studentId) return href;

  const [path, query] = href.split("?", 2);
  const params = new URLSearchParams(query ?? "");

  if (params.has("studentId")) return href;

  params.set("studentId", studentId);
  return `${path}?${params.toString()}`;
}
