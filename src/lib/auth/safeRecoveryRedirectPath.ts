/**
 * After `/api/auth/recovery-callback` exchanges the recovery `code`, we redirect
 * here. Guards against open redirects via forged `next` query params.
 */
export function safeRecoveryRedirectPath(raw: string | null): string {
  const fallback = "/es/reset-password";
  if (raw == null || raw.trim() === "") return fallback;
  const pathOnly = raw.split("?")[0]?.split("#")[0] ?? "";
  if (pathOnly === "/en/reset-password" || pathOnly === "/es/reset-password") {
    return pathOnly;
  }
  return fallback;
}
