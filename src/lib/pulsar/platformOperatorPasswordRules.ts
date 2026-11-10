export type OperatorPasswordCopy = {
  empty: string;
  short: string;
  long: string;
  saveFailed: string;
  loginFailed: string;
  unauthorized: string;
  notConfigured: string;
};

export function parseOperatorPassword(
  raw: string,
):
  | { ok: true; password: string }
  | { ok: false; errorCode: "operator_password_empty" | "operator_password_short" | "operator_password_long" } {
  const password = raw.trim();
  if (!password) return { ok: false, errorCode: "operator_password_empty" };
  if (password.length < 8) return { ok: false, errorCode: "operator_password_short" };
  if (password.length > 200) return { ok: false, errorCode: "operator_password_long" };
  return { ok: true, password };
}

export function operatorPasswordFormError(code: string, copy: OperatorPasswordCopy): string {
  if (code === "operator_password_empty") return copy.empty;
  if (code === "operator_password_short") return copy.short;
  if (code === "operator_password_long") return copy.long;
  if (code === "operator_password_save_failed") return copy.saveFailed;
  if (code === "operator_password_login_failed") return copy.loginFailed;
  if (code === "unauthorized") return copy.unauthorized;
  if (code === "not_configured") return copy.notConfigured;
  return code;
}
