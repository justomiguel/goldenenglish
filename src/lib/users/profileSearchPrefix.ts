/**
 * Normalized text for person search (accent-fold, lower, trim).
 * Shared by messaging pickers and admin/teacher student search.
 */
export function normalizePersonSearchText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Escape `%`, `_`, and `\` for use inside a PostgreSQL ILIKE pattern (backslash escape). */
export function escapeForIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** ILIKE pattern: user prefix + wildcard (caller trims). */
export function buildIlikePrefixPattern(rawQuery: string): string {
  return `${escapeForIlikePattern(rawQuery.trim())}%`;
}

/**
 * True when the query is empty, or first name, last name, or "first last" starts with the
 * normalized query (accent-insensitive).
 */
export function personNameFieldsMatchPrefix(
  r: { first_name: string; last_name: string },
  rawQuery: string,
): boolean {
  const q = normalizePersonSearchText(rawQuery);
  if (!q) return true;
  const fn = normalizePersonSearchText(r.first_name);
  const ln = normalizePersonSearchText(r.last_name);
  const full = `${fn} ${ln}`.trim();
  const lastFirst = `${ln} ${fn}`.trim();
  return (
    fn.startsWith(q) || ln.startsWith(q) || full.startsWith(q) || lastFirst.startsWith(q)
  );
}

/** Prefix on names or identity document (when present). */
export function personProfileMatchPrefix(
  r: { first_name: string; last_name: string; dni_or_passport?: string | null },
  rawQuery: string,
): boolean {
  if (personNameFieldsMatchPrefix(r, rawQuery)) return true;
  const q = normalizePersonSearchText(rawQuery);
  if (!q) return true;
  const dni = normalizePersonSearchText(r.dni_or_passport ?? "");
  return dni.startsWith(q);
}
