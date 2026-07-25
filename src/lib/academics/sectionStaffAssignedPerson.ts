export type SectionStaffAssignedKind = "lead" | "assistant";

export type SectionStaffAssignedPerson = {
  id: string;
  label: string;
  kind: SectionStaffAssignedKind;
  /** Profile role for assistant badge (teacher / student / assistant / admin). */
  role: string;
  phone: string | null;
  dniOrPassport: string | null;
  email: string | null;
  avatarDisplayUrl: string | null;
};

export type SectionStaffAssignedBadgeKey =
  | "leadBadge"
  | "assistantBadgeTeacher"
  | "assistantBadgeStudent"
  | "assistantBadgePortalAssistant"
  | "assistantBadge";

/** Pick dictionary badge key for an assigned portal person. */
export function sectionStaffAssignedBadgeKey(
  person: Pick<SectionStaffAssignedPerson, "kind" | "role">,
): SectionStaffAssignedBadgeKey {
  if (person.kind === "lead") return "leadBadge";
  const role = person.role.trim().toLowerCase();
  if (role === "student") return "assistantBadgeStudent";
  if (role === "assistant") return "assistantBadgePortalAssistant";
  if (role === "teacher" || role === "admin") return "assistantBadgeTeacher";
  return "assistantBadge";
}
