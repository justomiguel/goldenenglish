import type { Dictionary } from "@/types/i18n";

/** Shared admin-facing labels for `profiles.role` in portal messaging tables. */
export function portalMessageRoleDisplay(dict: Dictionary, role: string): string {
  if (role === "student") return dict.admin.messages.roleStudent;
  if (role === "parent") return dict.admin.messages.roleParent;
  if (role === "teacher") return dict.admin.messages.roleTeacher;
  if (role === "admin") return dict.admin.messages.roleAdmin;
  if (role === "site_contact") return dict.admin.messages.roleSiteContact;
  return role || dict.common.emptyValue;
}
