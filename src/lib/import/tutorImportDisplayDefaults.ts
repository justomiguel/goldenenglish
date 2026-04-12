import type { TutorDisplayDefaults } from "@/lib/register/tutorDisplayNameParts";

/** Used when locale-specific copy is not wired (e.g. some tests). */
export const TUTOR_IMPORT_DISPLAY_FALLBACK: TutorDisplayDefaults = {
  defaultFirstName: "Tutor",
  emptyLastName: "—",
};
