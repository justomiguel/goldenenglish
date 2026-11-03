/**
 * Builds the admin global contents repository URL with stable pagination/search params.
 */
export function buildAcademicContentsListPath(
  locale: string,
  searchParams: URLSearchParams,
  updates: { page?: number; q?: string; tag?: string; material?: string },
): string {
  const next = new URLSearchParams(searchParams.toString());
  if (updates.page !== undefined) {
    if (updates.page <= 1) next.delete("page");
    else next.set("page", String(updates.page));
  }
  if (updates.q !== undefined) {
    const t = updates.q.trim();
    if (t) next.set("q", t);
    else next.delete("q");
  }
  if (updates.tag !== undefined) {
    const tag = updates.tag.trim();
    if (tag) next.set("tag", tag);
    else next.delete("tag");
  }
  if (updates.material !== undefined) {
    const material = updates.material.trim();
    if (material) next.set("material", material);
    else next.delete("material");
  }
  const qs = next.toString();
  return `/${locale}/dashboard/admin/academic/contents${qs ? `?${qs}` : ""}`;
}
