import { z } from "zod";

const roleZ = z.enum(["admin", "teacher", "student", "parent", "assistant"]);

const emailSchema = z.string().trim().min(1).email();

const phoneSchema = z.string().trim().max(40, "phone_too_long");

const birthSchema = z.union([
  z.literal(""),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "birth_invalid"),
]);

export type AdminUserDetailUpdatableField =
  | "email"
  | "firstName"
  | "lastName"
  | "phone"
  | "dniOrPassport"
  | "birthDate"
  | "role";

export type ParseAdminUserDetailFieldResult =
  | { ok: true; normalized: string | null }
  | { ok: false; code: string };

/**
 * Validates a single inline-edit value for admin user profile updates.
 * `birthDate` empty string means clear date (null in DB).
 */
export function parseAdminUserDetailField(
  field: AdminUserDetailUpdatableField,
  raw: string,
): ParseAdminUserDetailFieldResult {
  switch (field) {
    case "email": {
      const r = emailSchema.safeParse(raw);
      if (!r.success) {
        const v = raw.trim();
        if (!v) return { ok: false, code: "email_required" };
        return { ok: false, code: "email_invalid" };
      }
      return { ok: true, normalized: r.data.toLowerCase() };
    }
    case "firstName":
    case "lastName": {
      const t = raw.trim();
      if (!t) return { ok: false, code: "name_required" };
      if (t.length > 120) return { ok: false, code: "name_too_long" };
      return { ok: true, normalized: t };
    }
    case "phone": {
      const r = phoneSchema.safeParse(raw);
      if (!r.success) {
        const iss = r.error.issues[0];
        if (iss?.code === "too_big") return { ok: false, code: "phone_too_long" };
        return { ok: false, code: "phone_invalid" };
      }
      const t = r.data;
      return { ok: true, normalized: t.length === 0 ? null : t };
    }
    case "dniOrPassport": {
      const t = raw.trim();
      if (!t) return { ok: false, code: "dni_required" };
      if (t.length > 32) return { ok: false, code: "dni_too_long" };
      return { ok: true, normalized: t };
    }
    case "birthDate": {
      const r = birthSchema.safeParse(raw.trim());
      if (!r.success) return { ok: false, code: "birth_invalid" };
      if (r.data === "") return { ok: true, normalized: null };
      return { ok: true, normalized: r.data };
    }
    case "role": {
      const r = roleZ.safeParse(raw.trim());
      if (!r.success) return { ok: false, code: "role_invalid" };
      return { ok: true, normalized: r.data };
    }
    default:
      return { ok: false, code: "unknown_field" };
  }
}
