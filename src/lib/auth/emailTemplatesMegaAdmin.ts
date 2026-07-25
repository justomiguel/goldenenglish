/** Login email allowed to manage admin email template overrides (all deployments). */
export const EMAIL_TEMPLATES_MEGA_ADMIN_EMAIL = "justomiguelvargas@gmail.com";

/**
 * Isolated E2E harness admin (`supabase/seeds/e2e/seed-admin.sql`).
 * Must reach the templates page so L3 `@admin-tours` can assert anchors.
 */
export const EMAIL_TEMPLATES_E2E_ADMIN_EMAIL = "e2e-admin@example.test";

const EMAIL_TEMPLATES_ADMIN_ALLOWLIST = new Set([
  EMAIL_TEMPLATES_MEGA_ADMIN_EMAIL,
  EMAIL_TEMPLATES_E2E_ADMIN_EMAIL,
]);

export function isEmailTemplatesMegaAdmin(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && EMAIL_TEMPLATES_ADMIN_ALLOWLIST.has(normalized));
}
