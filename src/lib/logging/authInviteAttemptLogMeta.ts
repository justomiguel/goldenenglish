/**
 * Hints for Auth `admin.createUser` logs (`[ge:server]`): who is invited + collision context.
 *
 * By default omit login identifiers except when Supabase returns duplicate login (**`email_exists`**):
 * callers may attach {@link authInviteCollisionEmailMeta} so staff can reconcile in Auth which
 * address collided (e.g. minor synthetic `nombreapellido-huella@MAIL_TENANT`). Treat exported logs as privileged.
 */

/** Returns the part after `@` for a trimmed lowercased login email, or undefined if malformed. */
export function authInviteEmailDomainSuffixForLog(normalizedLowerEmail: string): string | undefined {
  const normalized = normalizedLowerEmail.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at < 1 || at >= normalized.length - 1) return undefined;
  return normalized.slice(at + 1);
}

/** Use only when `classified_issue === "email_exists"` (duplicate login diagnostic). */
export function authInviteCollisionEmailMeta(rawAttemptedLoginEmail: string): {
  collision_attempt_email_normalized: string;
  collision_email_domain_suffix: string;
} {
  const collision_attempt_email_normalized = rawAttemptedLoginEmail.trim().toLowerCase();
  return {
    collision_attempt_email_normalized,
    collision_email_domain_suffix:
      authInviteEmailDomainSuffixForLog(collision_attempt_email_normalized) ?? "(no_domain_suffix)",
  };
}

/** Who this `createDashboardUser` Auth step is provisioning (before tutor link). */
export function resolveDashboardInviteSignupAttemptSubjectLog(opts: {
  creatingMinorStudent: boolean;
  minorSyntheticEmailSource: unknown | null | undefined;
  inviteRole: string;
}): string {
  if (opts.creatingMinorStudent) {
    return opts.minorSyntheticEmailSource
      ? "minor_student_institutional_generated_email"
      : "minor_student_non_synthetic_login_email";
  }
  return `dashboard_invite:${opts.inviteRole}`;
}
