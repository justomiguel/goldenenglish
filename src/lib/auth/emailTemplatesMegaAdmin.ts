/** Login email allowed to manage admin email template overrides (all deployments). */
export const EMAIL_TEMPLATES_MEGA_ADMIN_EMAIL = "justomiguelvargas@gmail.com";

export function isEmailTemplatesMegaAdmin(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  return normalized === EMAIL_TEMPLATES_MEGA_ADMIN_EMAIL;
}
