const NON_ALNUM_RE = /[^a-z0-9\s-]/g;
const MULTI_HYPHEN_RE = /-+/g;

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(NON_ALNUM_RE, "")
    .replace(/\s+/g, "-")
    .replace(MULTI_HYPHEN_RE, "-")
    .replace(/^-|-$/g, "");
}

export function ensureUniqueSlug(base: string, existing: ReadonlySet<string>): string {
  const normalized = normalizeSlug(base);
  const seed = normalized.length > 0 ? normalized : "post";
  if (!existing.has(seed)) return seed;
  let idx = 2;
  while (existing.has(`${seed}-${idx}`)) {
    idx += 1;
  }
  return `${seed}-${idx}`;
}
