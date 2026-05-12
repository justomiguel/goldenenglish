import type { Dictionary } from "@/types/i18n";
import type { ZodIssue } from "zod";
import type { AuthAdminInviteCreateUserIssue } from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";
import { appendAuthIncidentReferenceLine } from "@/lib/dashboard/appendAuthIncidentReferenceLine";
import { resolveCreateDashboardUserZodMessageCode } from "@/lib/dashboard/resolveCreateDashboardUserZodMessageCode";

export function localizeCreateDashboardUserError(
  dict: Dictionary,
  code: string,
  opts?: { supportRef?: string },
): string {
  const U = dict.admin.users;
  switch (code) {
    case "forbidden":
      return U.errCreateForbidden;
    case "invalid_data":
      return U.errCreateInvalid;
    case "password_policy":
      return U.errCreatePassword;
    case "auth_failed":
      return appendAuthIncidentReferenceLine(dict, U.inviteAuthUnexpected, opts?.supportRef);
    case "no_user_returned":
      return appendAuthIncidentReferenceLine(dict, U.errCreateNoUser, opts?.supportRef);
    case "email_exists":
      return U.errCreateEmailExists;
    case "weak_password":
      return U.errCreateWeakPassword;
    case "profile_save_failed":
      return U.errCreateProfileSave;
    case "invalid_email":
      return U.errCreateInvalidEmail;
    case "minor_student_dni_required":
      return U.errCreateMinorStudentDniRequired;
    case "guardian_mode_required":
      return U.errCreateGuardianModeRequired;
    case "guardian_pick_required":
      return U.errCreateGuardianPickRequired;
    default:
      return appendAuthIncidentReferenceLine(dict, U.inviteAuthUnexpected, opts?.supportRef);
  }
}

export function localizeCreateDashboardUserZod(dict: Dictionary, issues: ZodIssue[]): string {
  const key = resolveCreateDashboardUserZodMessageCode(issues);
  const U = dict.admin.users;
  switch (key) {
    case "invalid_email":
      return U.errCreateInvalidEmail;
    case "invalid_role":
      return U.errCreateInvalidRole;
    case "first_name_required":
      return U.errCreateFirstNameRequired;
    case "first_name_too_long":
      return U.errCreateFirstNameTooLong;
    case "last_name_required":
      return U.errCreateLastNameRequired;
    case "last_name_too_long":
      return U.errCreateLastNameTooLong;
    case "dni_too_long":
      return U.errCreateDniTooLong;
    case "phone_too_long":
      return U.errCreatePhoneTooLong;
    case "password_too_long":
      return U.errCreatePasswordTooLong;
    case "birth_date_invalid":
      return U.errCreateBirthDateInvalid;
    default:
      return U.errCreateInvalid;
  }
}

/** Maps non-duplicate `auth.admin.createUser` failures into staff-facing copy (student invite flow). */
export function localizeAdminInviteAuthIssue(
  dict: Dictionary,
  issue: Exclude<AuthAdminInviteCreateUserIssue, "email_exists">,
  opts?: { supportRef?: string },
): string {
  const U = dict.admin.users;
  switch (issue) {
    case "weak_password":
      return U.errCreateWeakPassword;
    case "invalid_email":
      return U.inviteAuthInvalidEmail;
    case "rate_limited":
      return U.inviteAuthRateLimited;
    case "signup_disabled":
      return U.inviteAuthSignupDisabled;
    case "unexpected":
      return appendAuthIncidentReferenceLine(dict, U.inviteAuthUnexpected, opts?.supportRef);
  }
}

/** Same as {@link localizeAdminInviteAuthIssue}, scoped to the minor student Auth step (before guardian link). */
export function localizeMinorStudentInviteAuthIssue(
  dict: Dictionary,
  issue: Exclude<AuthAdminInviteCreateUserIssue, "email_exists">,
  opts?: { supportRef?: string },
): string {
  const U = dict.admin.users;
  switch (issue) {
    case "weak_password":
      return U.inviteAuthMinorStudentWeakPassword;
    case "invalid_email":
      return U.inviteAuthMinorStudentInvalidEmail;
    case "rate_limited":
      return U.inviteAuthMinorStudentRateLimited;
    case "signup_disabled":
      return U.inviteAuthMinorStudentSignupDisabled;
    case "unexpected":
      return appendAuthIncidentReferenceLine(
        dict,
        U.inviteAuthMinorStudentUnexpected,
        opts?.supportRef,
      );
  }
}
