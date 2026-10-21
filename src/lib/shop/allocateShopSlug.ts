import { slugifyPublicPathSegment } from "@/lib/site/slugifyPublicPathSegment";

export function allocateShopSlug(
  title: string,
  taken: ReadonlySet<string>,
  currentSlug: string | null,
): { slug: string; retire: string | null } {
  const base = slugifyPublicPathSegment(title) || "producto";
  if (currentSlug && (currentSlug === base || currentSlug.startsWith(`${base}-`))) {
    if (!taken.has(base)) {
      return { slug: base, retire: currentSlug === base ? null : currentSlug };
    }
    if (!taken.has(currentSlug)) return { slug: currentSlug, retire: null };
  }
  let slug = base;
  if (taken.has(slug)) {
    let n = 2;
    while (taken.has(`${base}-${n}`)) n += 1;
    slug = `${base}-${n}`;
  }
  return { slug, retire: currentSlug && currentSlug !== slug ? currentSlug : null };
}
