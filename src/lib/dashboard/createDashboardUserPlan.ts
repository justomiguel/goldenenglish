import { z } from "zod";
import { zodOptionalEmptyField } from "@/lib/validation/zodOptionalEmptyField";
import type { Dictionary } from "@/types/i18n";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { composeSyntheticMinorStudentEmail } from "@/lib/register/composeSyntheticMinorStudentEmail";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";
import { localizeCreateDashboardUserError } from "@/lib/dashboard/localizeCreateDashboardUser";
import { TUTOR_STUDENT_RELATIONSHIP_CODES } from "@/lib/register/tutorStudentRelationship";
import type { AdminInvitedProfileFields } from "@/lib/dashboard/upsertAdminInvitedProfile";

const roleZ = z.enum(["admin", "teacher", "student", "parent", "assistant"]);
const guardianModeZ = z.enum(["existing", "new"]);
const tutorRelationshipZ = z.enum(
  TUTOR_STUDENT_RELATIONSHIP_CODES as unknown as [string, ...string[]],
);

export const createDashboardUserSchema = z.object({
  email: z.string().trim().max(320),
  password: z.string().max(72),
  role: roleZ.optional(),
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  dni_or_passport: z
    .string()
    .max(32)
    .transform((s) => {
      const t = s.trim();
      return t === "" ? null : t;
    }),
  phone: z
    .string()
    .max(40)
    .transform((s) => {
      const t = s.trim();
      return t === "" ? null : t;
    }),
  birth_date: zodOptionalEmptyField(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  student_guardian_mode: zodOptionalEmptyField(guardianModeZ),
  existing_guardian_id: zodOptionalEmptyField(z.string().uuid()),
  tutor_dni: z.string().max(64).optional(),
  tutor_first_name: z.string().max(120).optional(),
  tutor_last_name: z.string().max(120).optional(),
  tutor_email: z.string().max(320).optional(),
  tutor_phone: z.string().max(40).optional(),
  tutor_relationship: zodOptionalEmptyField(tutorRelationshipZ),
  provisioning_route: z.enum(["admin_ui", "registration_accept"]).optional(),
  locale: z.string().min(2).max(8).optional(),
});

export type CreateDashboardUserParsed = z.infer<typeof createDashboardUserSchema>;

export type MinorGuardianLinkInput = {
  guardianMode: "existing" | "new";
  existingGuardianId?: string;
  tutorDni: string | undefined;
  tutorFirstName: string | undefined;
  tutorLastName: string | undefined;
  tutorEmail: string;
  tutorPhone: string | undefined;
  relationship: string;
};

export type MinorSyntheticEmailSource = {
  first_name: string;
  last_name: string;
  dni: string;
  domain: string;
};

export type CreateDashboardUserInvitePlan =
  | { ok: false; message: string }
  | {
      ok: true;
      effectiveEmail: string;
      effectivePhone: string | null;
      minorLinkInput: MinorGuardianLinkInput | null;
      /** When set, `effectiveEmail` is MAIL_TENANT synthetic; Auth collision may append random letters to the name core. */
      minorSyntheticEmailSource: MinorSyntheticEmailSource | null;
      meta: Record<string, string>;
      inviteProfile: Omit<AdminInvitedProfileFields, "userId">;
    };

function emailFieldValid(raw: string): boolean {
  return z.string().email().safeParse(raw.trim()).success;
}

/** Resolves login email, profile phone, Auth metadata, minor guardian link intent. */
export function planCreateDashboardUserInvite(
  dict: Dictionary,
  parsed: CreateDashboardUserParsed,
): CreateDashboardUserInvitePlan {
  const finalRole = (parsed.role ?? "student") as AdminInvitedProfileFields["role"];
  const dniOrPassport = parsed.dni_or_passport;
  const phone = parsed.phone;
  const birthTrim = parsed.birth_date?.trim();

  let effectiveEmail: string;
  let effectivePhone: string | null = phone;
  let minorLinkInput: MinorGuardianLinkInput | null = null;
  let minorSyntheticEmailSource: MinorSyntheticEmailSource | null = null;

  if (finalRole === "student") {
    if (!birthTrim || !/^\d{4}-\d{2}-\d{2}$/.test(birthTrim)) {
      return {
        ok: false,
        message: localizeRegistrationAcceptError(dict, "birth_date_required"),
      };
    }
    const legal = getLegalAgeMajorityFromSystem();
    const age = fullYearsFromIsoDate(birthTrim);
    const isMinor = age < legal;
    const route = parsed.provisioning_route ?? "admin_ui";
    if (isMinor) {
      if (!dniOrPassport) {
        return { ok: false, message: localizeCreateDashboardUserError(dict, "minor_student_dni_required") };
      }
      if (route === "registration_accept") {
        if (!emailFieldValid(parsed.email)) {
          return { ok: false, message: localizeCreateDashboardUserError(dict, "invalid_email") };
        }
        effectiveEmail = parsed.email.trim().toLowerCase();
        effectivePhone = null;
      } else {
        const tenant = getRegistrationMailTenantDomain();
        if (!tenant) {
          return { ok: false, message: dict.actionErrors.register.mailTenantMissing };
        }
        effectiveEmail = composeSyntheticMinorStudentEmail(
          parsed.first_name,
          parsed.last_name,
          dniOrPassport,
          tenant,
        ).toLowerCase();
        minorSyntheticEmailSource = {
          first_name: parsed.first_name,
          last_name: parsed.last_name,
          dni: dniOrPassport,
          domain: tenant,
        };
        effectivePhone = null;

        const mode = parsed.student_guardian_mode;
        if (!mode) {
          return { ok: false, message: localizeCreateDashboardUserError(dict, "guardian_mode_required") };
        }
        const rel = parsed.tutor_relationship;
        if (!rel) {
          return { ok: false, message: dict.admin.users.detailErrTutorRelationshipRequired };
        }
        if (mode === "existing") {
          if (!parsed.existing_guardian_id) {
            return { ok: false, message: localizeCreateDashboardUserError(dict, "guardian_pick_required") };
          }
        } else {
          const tdni = parsed.tutor_dni?.trim() ?? "";
          if (tdni.toLowerCase() === dniOrPassport.toLowerCase()) {
            return {
              ok: false,
              message: localizeRegistrationAcceptError(dict, "tutor_dni_same_as_student"),
            };
          }
          const te = (parsed.tutor_email ?? "").trim();
          if (te && !emailFieldValid(te)) {
            return { ok: false, message: dict.actionErrors.registrationDraft.invalidTutorEmail };
          }
          const teLow = te.toLowerCase();
          if (teLow && teLow === effectiveEmail) {
            return { ok: false, message: dict.register.tutorEmailSameAsStudent };
          }
        }

        minorLinkInput = {
          guardianMode: mode,
          existingGuardianId: parsed.existing_guardian_id,
          tutorDni: parsed.tutor_dni,
          tutorFirstName: parsed.tutor_first_name,
          tutorLastName: parsed.tutor_last_name,
          tutorEmail: parsed.tutor_email ?? "",
          tutorPhone: parsed.tutor_phone?.trim() ? parsed.tutor_phone.trim() : undefined,
          relationship: rel,
        };
      }
    } else {
      if (!emailFieldValid(parsed.email)) {
        return { ok: false, message: localizeCreateDashboardUserError(dict, "invalid_email") };
      }
      effectiveEmail = parsed.email.trim().toLowerCase();
    }
  } else {
    if (!emailFieldValid(parsed.email)) {
      return { ok: false, message: localizeCreateDashboardUserError(dict, "invalid_email") };
    }
    effectiveEmail = parsed.email.trim().toLowerCase();
  }

  const meta: Record<string, string> = {
    first_name: parsed.first_name,
    last_name: parsed.last_name,
    provisioning_source: "admin_invite",
    role: finalRole,
  };
  if (dniOrPassport) meta.dni_or_passport = dniOrPassport;
  if (effectivePhone) meta.phone = effectivePhone;
  if (birthTrim) meta.birth_date = birthTrim;

  return {
    ok: true,
    effectiveEmail,
    effectivePhone,
    minorLinkInput,
    minorSyntheticEmailSource,
    meta,
    inviteProfile: {
      role: finalRole,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      dni_or_passport: dniOrPassport,
      phone: effectivePhone,
      birth_date: parsed.birth_date,
    },
  };
}
