/** Form `<select>` value when the applicant wants staff to assign a section later. */
export const REGISTRATION_UNDECIDED_FORM_VALUE = "__ge_undecided__" as const;

/**
 * Stored in `registrations.level_interest` for undecided (locale-neutral; show
 * `admin.registrations.levelInterestUndecided` in UI).
 */
export const REGISTRATION_LEVEL_INTEREST_UNDECIDED = "__ge_section_tbd__" as const;

export function isRegistrationUndecidedStored(
  raw: string | null | undefined,
): boolean {
  return String(raw ?? "").trim() === REGISTRATION_LEVEL_INTEREST_UNDECIDED;
}
