export type PortalMessagingRole = "student" | "parent" | "teacher" | "admin";

const TEACHER_RECIPIENT_ROLES: ReadonlySet<PortalMessagingRole> = new Set([
  "student",
  "parent",
  "teacher",
  "admin",
]);

export function isPortalMessagingRole(role: string | null | undefined): role is PortalMessagingRole {
  return role === "student" || role === "parent" || role === "teacher" || role === "admin";
}

export function isRecipientAllowedForTeacher(role: string | null | undefined): boolean {
  return isPortalMessagingRole(role) && TEACHER_RECIPIENT_ROLES.has(role);
}

export function isRecipientAllowedForAdmin(
  role: string | null | undefined,
  senderId: string,
  recipientId: string,
): boolean {
  if (recipientId === senderId) return false;
  return isRecipientAllowedForTeacher(role);
}
