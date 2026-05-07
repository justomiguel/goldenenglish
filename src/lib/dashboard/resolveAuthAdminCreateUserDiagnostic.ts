export type AuthAdminCreateUserDiagnostic =
  | "email_exists"
  | "weak_password"
  | null;

/** Maps Supabase Auth admin.createUser errors to a stable diagnostic (no UI copy here). */
export function resolveAuthAdminCreateUserDiagnostic(err: {
  message?: string | null;
  code?: string | null;
  status?: number | string | null;
}): AuthAdminCreateUserDiagnostic {
  const msg = String(err.message ?? "").toLowerCase();
  const code = String(err.code ?? "").toLowerCase();

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

  return null;
}
