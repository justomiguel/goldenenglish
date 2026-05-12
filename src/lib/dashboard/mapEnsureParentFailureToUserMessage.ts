import type { Dictionary } from "@/types/i18n";
import { appendAuthIncidentReferenceLine } from "@/lib/dashboard/appendAuthIncidentReferenceLine";

/** User-facing copy for `ensureParentProfileByTutorDni` failure codes (admin + registration). */
export function mapEnsureParentFailureToUserMessage(
  dict: Dictionary,
  code: string,
  supportRef?: string,
): string {
  const L = dict.admin.users;
  switch (code) {
    case "tutor_dni_required":
      return L.detailTutorCreateErrDniRequired;
    case "tutor_dni_in_use_by_student":
      return L.detailTutorCreateErrDniStudent;
    case "tutor_auth_email_exists":
      return L.inviteAuthGuardianEmailExists;
    case "tutor_auth_weak_password":
      return L.inviteAuthGuardianWeakPassword;
    case "tutor_auth_invalid_email":
      return L.inviteAuthGuardianInvalidEmail;
    case "tutor_auth_rate_limited":
      return L.inviteAuthGuardianRateLimited;
    case "tutor_auth_signup_disabled":
      return L.inviteAuthGuardianSignupDisabled;
    case "tutor_auth_unexpected":
      return appendAuthIncidentReferenceLine(dict, L.inviteAuthGuardianUnexpected, supportRef);
    case "tutor_auth_no_user_returned":
      return appendAuthIncidentReferenceLine(dict, L.inviteAuthGuardianNoUserReturned, supportRef);
    case "tutor_email_parent_dni_mismatch":
      return L.detailTutorCreateErrEmailParentDniMismatch;
    case "tutor_email_admin_dni_mismatch":
      return L.detailTutorCreateErrEmailAdminDniMismatch;
    case "tutor_email_in_use_non_parent_role":
      return L.detailTutorCreateErrEmailNonParentRole;
    case "auth_failed":
    case "no_user_returned":
      return appendAuthIncidentReferenceLine(dict, L.inviteAuthGuardianUnexpected, supportRef);
    default:
      return L.detailErrSave;
  }
}
