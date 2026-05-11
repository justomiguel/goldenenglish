/**
 * PostgREST `.or()` fragments for admin users list search on `profiles`.
 * Email is resolved separately (auth.users) and passed as `emailMatchUserId`.
 */

const PARENT_ROLE_SEARCH_TOKENS = new Set([
  "tutor",
  "tutores",
  "padre",
  "padres",
  "parent",
  "parents",
  "guardian",
  "guardians",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Single-token queries that should match every profile with role `parent` (tutores). */
export function parentRoleSearchTokenMatches(q: string): boolean {
  const tokens = q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return tokens.length === 1 && PARENT_ROLE_SEARCH_TOKENS.has(tokens[0]);
}

/** Full email address — enables auth lookup (exact match). */
export function looksLikeFullEmailQuery(q: string): boolean {
  const t = q.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function looksLikeUuidQuery(q: string): boolean {
  return UUID_RE.test(q.trim());
}

export function buildAdminUsersProfileOrFilter(
  q: string,
  emailMatchUserId: string | null,
): string {
  const trimmed = q.trim();
  const escaped = trimmed.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const pattern = `%${escaped}%`;
  const parts = [
    `first_name.ilike.${pattern}`,
    `last_name.ilike.${pattern}`,
    `phone.ilike.${pattern}`,
    `dni_or_passport.ilike.${pattern}`,
  ];
  if (emailMatchUserId) {
    parts.push(`id.eq.${emailMatchUserId}`);
  }
  if (looksLikeUuidQuery(trimmed)) {
    parts.push(`id.eq.${trimmed}`);
  }
  if (parentRoleSearchTokenMatches(trimmed)) {
    parts.push("role.eq.parent");
  }
  return parts.join(",");
}
