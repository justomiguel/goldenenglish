import type { Dictionary } from "@/types/i18n";

type UserLabels = Dictionary["admin"]["users"];

export function adminUserRoleOptionLabel(labels: UserLabels, role: string): string {
  switch (role) {
    case "admin":
      return labels.roleOptionAdmin;
    case "teacher":
      return labels.roleOptionTeacher;
    case "student":
      return labels.roleOptionStudent;
    case "parent":
      return labels.roleOptionParent;
    case "assistant":
      return labels.roleOptionAssistant;
    default:
      return role;
  }
}
