/** URL slug for a shop listing. Collision suffix stays inside 120 characters. */
export function courseSlugFromTitle(title: string, existing: ReadonlySet<string>): string {
  const folded = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const base = folded.length > 0 ? folded : "curso";
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`.slice(0, 120);
}
