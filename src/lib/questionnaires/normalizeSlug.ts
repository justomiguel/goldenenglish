const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugFromTitle(title: string): string {
  const ascii = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const parsed = normalizeQuestionnaireSlug(ascii);
  return parsed.ok ? parsed.slug : "";
}

export function normalizeQuestionnaireSlug(
  raw: string,
): { ok: true; slug: string } | { ok: false } {
  const slug = raw.trim().toLowerCase();
  if (slug.length < 2 || slug.length > 80) return { ok: false };
  if (!SLUG_RE.test(slug)) return { ok: false };
  return { ok: true, slug };
}
