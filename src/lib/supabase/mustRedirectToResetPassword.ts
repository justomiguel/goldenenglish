/**
 * Pure decision: should this request be redirected to /reset-password because
 * the authenticated user has the must_change_password flag in app_metadata?
 *
 * The flag is set by `resetUserPasswordByDniAction` (admin) and cleared by
 * `clearMustChangePasswordFlagAction` once the user picks a new password. Only
 * the service role can flip it (it lives in `app_metadata`, not the
 * user-writable `user_metadata`).
 */
/** Accepts Supabase `User`: `app_metadata` is widen so middleware can pass the session user. */
export interface ResetPasswordGuardUser {
  app_metadata?: unknown;
}

const RESET_PATH = /\/reset-password(\/|$)/;
const FORGOT_PATH = /\/forgot-password(\/|$)/;
const LOGIN_PATH = /\/(login|register)(\/|$)/;

export function mustRedirectToResetPassword(
  user: ResetPasswordGuardUser | null | undefined,
  pathname: string,
): boolean {
  if (!user) return false;
  const meta = user.app_metadata as { must_change_password?: boolean } | null | undefined;
  const flag = meta?.must_change_password === true;
  if (!flag) return false;

  if (RESET_PATH.test(pathname)) return false;
  if (FORGOT_PATH.test(pathname)) return false;
  if (LOGIN_PATH.test(pathname)) return false;
  if (pathname.startsWith("/api/auth/")) return false;
  if (pathname.startsWith("/api/analytics/")) return false;

  return true;
}
