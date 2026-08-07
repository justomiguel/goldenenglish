import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";

/**
 * Appends `?studentId=<value>` to `href` when `studentId` is non-empty and
 * `href` does not already carry a `studentId` parameter. Pure; no DOM, no router.
 *
 * Returns `href` unchanged when:
 * - `studentId` is null or empty
 * - `href` already contains `studentId=`
 */
export function withStudentIdHref(href: string, studentId: string | null): string {
  return withParentFocusHref(href, { studentId, sectionId: null });
}
