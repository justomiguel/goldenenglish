/**
 * Appends `studentId` / `sectionId` query params when provided and not already
 * present on `href`. Preserves other query keys (e.g. `tab`). Pure; no DOM.
 */
export function withParentFocusHref(
  href: string,
  focus: { studentId: string | null; sectionId: string | null },
): string {
  const { studentId, sectionId } = focus;
  if (!studentId && !sectionId) return href;

  const [path, query] = href.split("?", 2);
  const params = new URLSearchParams(query ?? "");

  if (studentId && !params.has("studentId")) {
    params.set("studentId", studentId);
  }
  if (sectionId && !params.has("sectionId")) {
    params.set("sectionId", sectionId);
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
