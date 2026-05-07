import type { Dictionary } from "@/types/i18n";
import type { ZodIssue } from "zod";
import { resolveCreateDashboardUserZodMessageCode } from "@/lib/dashboard/resolveCreateDashboardUserZodMessageCode";

export function localizeCreateDashboardUserError(dict: Dictionary, code: string): string {
  const U = dict.admin.users;
  switch (code) {
    case "forbidden":
      return U.errCreateForbidden;
    case "invalid_data":
      return U.errCreateInvalid;
    case "password_policy":
      return U.errCreatePassword;
    case "auth_failed":
      return U.errCreateAuth;
    case "no_user_returned":
      return U.errCreateNoUser;
    case "email_exists":
      return U.errCreateEmailExists;
    case "weak_password":
      return U.errCreateWeakPassword;
    case "profile_save_failed":
      return U.errCreateProfileSave;
    default:
      return U.errCreateAuth;
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
