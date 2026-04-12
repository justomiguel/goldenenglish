import { describe, it, expect } from "vitest";
import { dictEn } from "@/test/dictEn";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";

describe("localizeRegistrationAcceptError", () => {
  const R = dictEn.admin.registrations;
  const U = dictEn.admin.users;

  it.each([
    ["rollback_failed", R.errRollbackFailed],
    ["forbidden", U.errCreateForbidden],
    ["invalid_data", U.errCreateInvalid],
    ["not_found", U.errCreateNotFound],
    ["already_processed", R.alreadyProcessed],
    ["birth_date_required", R.errBirthDateRequired],
    ["minor_requires_tutor_dni", R.errMinorRequiresTutorDni],
    ["tutor_dni_same_as_student", R.errTutorDniSameAsStudent],
    ["no_course_for_level", R.errNoCourseForLevel],
    ["no_user_returned", U.errCreateNoUser],
    ["auth_failed", U.errCreateAuth],
    ["password_policy", U.errCreatePassword],
    ["tutor_dni_required", R.errMinorRequiresTutorDni],
    ["tutor_dni_in_use_by_student", R.errTutorDniInUseByStudent],
    ["enrollment_failed", R.errEnrollmentFailed],
    ["link_failed", R.errTutorLinkFailed],
    ["save_failed", R.errSaveFailed],
  ] as const)("maps code %s", (code, expected) => {
    expect(localizeRegistrationAcceptError(dictEn, code)).toBe(expected);
  });

  it("uses default copy for unknown codes", () => {
    expect(localizeRegistrationAcceptError(dictEn, "unknown_xyz")).toBe(R.errSaveFailed);
  });
});
