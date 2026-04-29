/**
 * Pure parser used by the login flow to decide whether the typed identifier
 * is an email address (existing path: straight to `signInWithPassword`) or a
 * national document number / passport (DNI) that needs server-side resolution
 * to the matching `auth.users.email` before sign-in.
 *
 * No imports from Supabase or React: keep it framework-free so the same logic
 * runs in the hook (browser) and in the route handler (server) without
 * duplicating the rule.
 */

export type ParsedLoginIdentifier =
  | { kind: "email"; value: string }
  | { kind: "dni"; value: string }
  | { kind: "invalid" };

/**
 * Loose RFC 5322-friendly check (same shape as `requestPasswordReset.ts`).
 * Anything that doesn't pass this is treated as a DNI; the actual email
 * validation still happens at Supabase Auth.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mirror of `normalizeDni` in `src/lib/import/studentImportUtils.ts` for the
 * normalization-only half (we don't need the derived initial password here).
 * Kept inline so this module stays free of import-domain dependencies.
 */
function normalizeDniValue(raw: string): string {
  return raw.replace(/\./g, "").replace(/\s/g, "").trim();
}

export function parseLoginIdentifier(raw: string): ParsedLoginIdentifier {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { kind: "invalid" };
  }
  const lowered = trimmed.toLowerCase();
  if (EMAIL_SHAPE.test(lowered)) {
    return { kind: "email", value: lowered };
  }
  const dni = normalizeDniValue(trimmed);
  if (dni.length === 0) {
    return { kind: "invalid" };
  }
  return { kind: "dni", value: dni };
}
