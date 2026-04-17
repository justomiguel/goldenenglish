/**
 * Pure: turns a free-form template name into a stable, ASCII, kebab-case slug
 * that fits the `public.site_themes.slug` UNIQUE constraint. Used both at form
 * submit time (autofill suggestion) and inside `createSiteThemeAction` (server-
 * side normalization, never trust the client). Returns `null` when the input
 * cannot be reduced to at least one allowed character.
 *
 * Slug rules:
 *  - Lowercase ASCII letters, digits, and `-` only.
 *  - No leading / trailing dashes; no consecutive dashes.
 *  - Max length 64 (matches Postgres TEXT comfortably + URL friendliness).
 */
export function normalizeThemeSlug(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const decomposed = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lowered = decomposed.toLowerCase();
  const replaced = lowered.replace(/[^a-z0-9]+/g, "-");
  const trimmed = replaced.replace(/^-+|-+$/g, "").slice(0, 64).replace(/-+$/g, "");
  if (!trimmed) return null;
  return trimmed;
}

/**
 * Pure: builds the "next" slug when duplicating an existing theme. Appends
 * `-copy` (or `-copy-N` when collisions are detected) so the operation is
 * deterministic. Caller is responsible for collision detection at the DB layer
 * (UNIQUE constraint stops illegal writes regardless).
 */
export function suggestDuplicatedThemeSlug(
  baseSlug: string,
  existingSlugs: ReadonlySet<string>,
): string {
  const base = normalizeThemeSlug(baseSlug);
  if (!base) return `theme-copy`;
  const stripped = base.replace(/-copy(-\d+)?$/u, "");
  const root = stripped || base;

  let candidate = `${root}-copy`.slice(0, 64);
  if (!existingSlugs.has(candidate)) return candidate;

  for (let i = 2; i < 1000; i += 1) {
    candidate = `${root}-copy-${i}`.slice(0, 64);
    if (!existingSlugs.has(candidate)) return candidate;
  }
  return `${root}-copy-${Date.now().toString(36)}`.slice(0, 64);
}
