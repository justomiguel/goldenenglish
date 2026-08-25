import type { AdminCreateUserRoleOption } from "@/components/dashboard/AdminCreateUserPersonalBlock";

const ROLES: readonly AdminCreateUserRoleOption[] = [
  "admin",
  "teacher",
  "parent",
  "student",
  "assistant",
];

export function parseAdminCreateUserRoleQuery(
  raw: string | undefined,
): AdminCreateUserRoleOption {
  if (raw && (ROLES as readonly string[]).includes(raw)) {
    return raw as AdminCreateUserRoleOption;
  }
  return "student";
}
