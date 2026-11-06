export const REGISTER_SECTION_MODES = ["student_choice", "first_open", "admin_assign"] as const;

export type RegisterSectionMode = (typeof REGISTER_SECTION_MODES)[number];

export function isRegisterSectionMode(value: unknown): value is RegisterSectionMode {
  return value === "student_choice" || value === "first_open" || value === "admin_assign";
}

/** A valid stored string wins. Anything else follows the old show-all boolean. */
export function parseRegisterSectionMode(raw: unknown, showAllSections: boolean): RegisterSectionMode {
  if (isRegisterSectionMode(raw)) return raw;
  return showAllSections ? "student_choice" : "first_open";
}
