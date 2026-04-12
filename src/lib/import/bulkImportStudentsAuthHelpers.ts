export function inviteMeta(
  base: Record<string, string>,
  role: "student" | "parent",
): Record<string, unknown> {
  return { ...base, provisioning_source: "admin_invite", role };
}

export function isDuplicateAuthError(err: { message?: string } | null | undefined): boolean {
  const m = err?.message?.toLowerCase() ?? "";
  return (
    m.includes("already been registered") ||
    m.includes("already registered") ||
    m.includes("user already registered") ||
    m.includes("duplicate key value") ||
    m.includes("email address has already")
  );
}
