/**
 * Supabase `auth.admin.createUser` failures — classify for staff-facing UI (no literals here).
 */

export type AuthAdminInviteCreateUserIssue =
  | "email_exists"
  | "weak_password"
  | "invalid_email"
  | "rate_limited"
  | "signup_disabled"
  | "unexpected";

export type AuthAdminCreateUserDiagnostic = "email_exists" | "weak_password" | null;

function parseAuthErrorStatus(status: unknown): number | undefined {
  if (typeof status === "number" && Number.isFinite(status)) return status;
  if (typeof status === "string" && /^[0-9]+$/.test(status)) return Number.parseInt(status, 10);
  return undefined;
}

/** Narrow Supabase / GoTrue `createUser` errors for invite / admin flows (student or guardian). */
export function resolveAuthAdminInviteCreateUserIssue(err: {
  message?: string | null;
  code?: string | null;
  status?: number | string | null;
}): AuthAdminInviteCreateUserIssue {
  const msg = String(err.message ?? "").toLowerCase();
  const code = String(err.code ?? "").toLowerCase();
  const statusNum = parseAuthErrorStatus(err.status);

  const duplicateHints =
    msg.includes("already registered") ||
    msg.includes("user already registered") ||
    msg.includes("email address has already been registered") ||
    msg.includes("email already registered") ||
    (msg.includes("database error saving new user") && msg.includes("unique")) ||
    code === "email_exists";

  if (duplicateHints || (msg.includes("duplicate") && msg.includes("email"))) {
    return "email_exists";
  }

  if (
    msg.includes("password") &&
    (msg.includes("weak") || msg.includes("strength") || msg.includes("should contain"))
  ) {
    return "weak_password";
  }

  if (
    code === "email_address_invalid" ||
    msg.includes("invalid email") ||
    (msg.includes("invalid login") && msg.includes("email")) ||
    msg.includes("email format") ||
    msg.includes("unable to validate email address") ||
    msg.includes("is not valid")
  ) {
    return "invalid_email";
  }

  if (
    statusNum === 429 ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("over_request_rate_limit") ||
    code === "over_request_rate_limit"
  ) {
    return "rate_limited";
  }

  if (
    msg.includes("signup_disabled") ||
    msg.includes("signups not allowed") ||
    (msg.includes("signup") && msg.includes("disabled"))
  ) {
    return "signup_disabled";
  }

  return "unexpected";
}

/** @deprecated Narrow diagnostic for legacy repair branching (duplicate / weak only). */
export function resolveAuthAdminCreateUserDiagnostic(err: {
  message?: string | null;
  code?: string | null;
  status?: number | string | null;
}): AuthAdminCreateUserDiagnostic {
  const issue = resolveAuthAdminInviteCreateUserIssue(err);
  if (issue === "email_exists") return "email_exists";
  if (issue === "weak_password") return "weak_password";
  return null;
}
