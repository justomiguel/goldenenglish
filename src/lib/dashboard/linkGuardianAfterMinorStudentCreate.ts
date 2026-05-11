import type { AppLocale } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/types/i18n";
import { createAdminParentAndLinkStudentAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailTutorCreateActions";
import { upsertAdminStudentTutorLinkAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailTutorActions";

export type LinkGuardianAfterMinorStudentCreateOutcome =
  | { kind: "ok" }
  | { kind: "error"; message: string }
  | {
      kind: "needs_guardian_reuse_confirm";
      reuseKind: "reused_parent" | "reused_admin";
      existingProfileId: string;
    };

export async function linkGuardianAfterMinorStudentCreate(
  appLocale: AppLocale,
  dict: Dictionary,
  input: {
    studentId: string;
    guardianMode: "existing" | "new";
    existingGuardianId?: string;
    tutorDni: string | undefined;
    tutorFirstName: string | undefined;
    tutorLastName: string | undefined;
    tutorEmail: string;
    tutorPhone: string | undefined;
    relationship: string;
  },
): Promise<LinkGuardianAfterMinorStudentCreateOutcome> {
  const L = dict.admin.users;
  if (input.guardianMode === "existing") {
    if (!input.existingGuardianId) {
      return { kind: "error", message: L.errCreateGuardianPickRequired };
    }
    const r = await upsertAdminStudentTutorLinkAction({
      locale: appLocale,
      studentId: input.studentId,
      newTutorId: input.existingGuardianId,
      relationship: input.relationship,
    });
    if (!r.ok) {
      return { kind: "error", message: r.message ?? L.detailErrSave };
    }
    return { kind: "ok" };
  }

  const r = await createAdminParentAndLinkStudentAction({
    locale: appLocale,
    studentId: input.studentId,
    tutorDni: input.tutorDni?.trim() ?? "",
    tutorFirstName: input.tutorFirstName?.trim() ?? "",
    tutorLastName: input.tutorLastName?.trim() ?? "",
    tutorEmail: input.tutorEmail.trim(),
    tutorPhone: input.tutorPhone,
    relationship: input.relationship,
  });

  if (r.ok) {
    return { kind: "ok" };
  }
  if ("needsConfirmation" in r && r.needsConfirmation === true) {
    return {
      kind: "needs_guardian_reuse_confirm",
      reuseKind: r.reuseKind,
      existingProfileId: r.existingProfileId,
    };
  }
  return {
    kind: "error",
    message: "message" in r ? (r.message ?? L.detailErrSave) : L.detailErrSave,
  };
}
