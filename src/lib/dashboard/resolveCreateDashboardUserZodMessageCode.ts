import type { ZodIssue } from "zod";

export type CreateDashboardUserZodMessageCode =
  | "invalid_email"
  | "invalid_role"
  | "first_name_required"
  | "first_name_too_long"
  | "last_name_required"
  | "last_name_too_long"
  | "dni_too_long"
  | "phone_too_long"
  | "password_too_long"
  | "birth_date_invalid"
  | "unknown";

export function resolveCreateDashboardUserZodMessageCode(
  issues: ZodIssue[],
): CreateDashboardUserZodMessageCode {
  const i = issues[0];
  if (!i) return "unknown";

  const path0 = i.path[0];
  const field = typeof path0 === "string" ? path0 : "unknown";

  if (field === "email") return "invalid_email";
  if (field === "role") return "invalid_role";
  if (field === "first_name") {
    if (i.code === "too_small") return "first_name_required";
    if (i.code === "too_big") return "first_name_too_long";
    return "first_name_required";
  }
  if (field === "last_name") {
    if (i.code === "too_small") return "last_name_required";
    if (i.code === "too_big") return "last_name_too_long";
    return "last_name_required";
  }
  if (field === "dni_or_passport") {
    if (i.code === "too_big") return "dni_too_long";
    return "unknown";
  }
  if (field === "phone") {
    if (i.code === "too_big") return "phone_too_long";
    return "unknown";
  }
  if (field === "password") {
    if (i.code === "too_big") return "password_too_long";
    return "unknown";
  }
  if (field === "birth_date") return "birth_date_invalid";

  return "unknown";
}
