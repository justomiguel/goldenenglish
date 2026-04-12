import type { Dictionary } from "@/types/i18n";

/** Maps internal accept-registration outcome codes to `admin.registrations` / `admin.users` copy. */
export function localizeRegistrationAcceptError(dict: Dictionary, code: string): string {
  const R = dict.admin.registrations;
  const U = dict.admin.users;
  switch (code) {
    case "rollback_failed":
      return R.errRollbackFailed;
    case "forbidden":
      return U.errCreateForbidden;
    case "invalid_data":
      return U.errCreateInvalid;
    case "not_found":
      return U.errCreateNotFound;
    case "already_processed":
      return R.alreadyProcessed;
    case "birth_date_required":
      return R.errBirthDateRequired;
    case "minor_requires_tutor_dni":
      return R.errMinorRequiresTutorDni;
    case "tutor_dni_same_as_student":
      return R.errTutorDniSameAsStudent;
    case "no_course_for_level":
      return R.errNoCourseForLevel;
    case "no_user_returned":
      return U.errCreateNoUser;
    case "auth_failed":
      return U.errCreateAuth;
    case "password_policy":
      return U.errCreatePassword;
    case "tutor_dni_required":
      return R.errMinorRequiresTutorDni;
    case "tutor_dni_in_use_by_student":
      return R.errTutorDniInUseByStudent;
    case "enrollment_failed":
      return R.errEnrollmentFailed;
    case "link_failed":
      return R.errTutorLinkFailed;
    case "save_failed":
      return R.errSaveFailed;
    default:
      return R.errSaveFailed;
  }
}
